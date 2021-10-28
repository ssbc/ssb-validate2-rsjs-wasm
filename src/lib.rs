// SPDX-FileCopyrightText: 2021 Andrew 'glyph' Reid
//
// SPDX-License-Identifier: LGPL-3.0-only

mod generated;
extern crate wapc_guest as guest;
pub use generated::*;
use guest::prelude::*;

use ssb_crypto::{AsBytes, NetworkKey as MsgHmacKey};
use ssb_validate::{
    message_value::{
        par_validate_message_value, par_validate_message_value_hash_chain_of_feed,
        par_validate_ooo_message_value_hash_chain_of_feed, validate_message_value,
        validate_message_value_hash_chain, validate_ooo_message_value_hash_chain,
    },
    utils,
};
use ssb_verify_signatures::verify_message_value;

fn is_valid_hmac_key(hmac_key: Option<Vec<u8>>) -> Result<Option<Vec<u8>>, String> {
    match hmac_key {
        Some(hmac) => {
            let key = MsgHmacKey::from_slice(&hmac);
            match key {
                None => Err("hmac key invalid: byte length must equal 32".to_string()),
                Some(key_val) => {
                    let key_bytes = key_val.as_bytes().to_vec();
                    Ok(Some(key_bytes))
                }
            }
        }
        None => Ok(None),
    }
}

fn hash(msgs: Vec<Vec<u8>>) -> Vec<String> {
    let mut keys = Vec::new();
    for msg in msgs {
        let multihash = utils::multihash_from_bytes(&msg);
        let key = multihash.to_legacy_string();
        keys.push(key);
    }
    keys
}

#[no_mangle]
pub fn wapc_init() {
    Handlers::register_verify_signatures(verify_signatures);
    Handlers::register_validate_single(validate_single);
    Handlers::register_validate_batch(validate_batch);
    Handlers::register_validate_ooo_batch(validate_ooo_batch);
    Handlers::register_validate_multi_author_batch(validate_multi_author_batch);
}

/// Verify signatures for an array of messages (includes HMAC key support).
///
/// Takes an HMAC key as the first argument and an array of messages as the second argument.
/// The HMAC key must be of type `ArrayBuffer`. Message signatures are verified without
/// an HMAC key if the value of the argument is `null` or `undefined` (maps to a `None` value).
///
/// If verification fails, the cause of the error is returned along with the offending message.
/// Note: this method only verifies message signatures; it does not perform full message validation
/// (use `verify_validate_message_array` for complete verification and validation).
fn verify_signatures(
    hmac_key: Option<Vec<u8>>,
    elements: Vec<String>,
) -> HandlerResult<Vec<String>> {
    let valid_hmac = is_valid_hmac_key(hmac_key)?;
    let hmac = valid_hmac.as_deref();

    let mut msgs = Vec::new();
    for msg in elements {
        let msg_bytes = msg.into_bytes();
        msgs.push(msg_bytes)
    }

    for msg_bytes in &msgs {
        // attempt verification and match on error to find invalid message
        match verify_message_value(&msg_bytes, hmac) {
            Ok(_) => (),
            Err(e) => {
                let invalid_msg_str = std::str::from_utf8(msg_bytes).unwrap_or(
                    "unable to convert invalid message bytes to string slice; not valid utf8",
                );
                let err_msg = format!("found invalid message: {}: {}", e, invalid_msg_str);
                return Err(err_msg.into());
            }
        };
    }

    let keys = hash(msgs);
    Ok(keys)
}

/// Verify signature and perform validation for a single message (includes HMAC key support).
///
/// Takes an HMAC key as the first argument, message `value` as the second argument and an optional
/// previous message `value` as the third argument. The HMAC key must be of type `ArrayBuffer`.
/// Message signatures are verified without an HMAC key if the value of the argument
/// is `null` or `undefined` (maps to a `None` value). The previous message argument is expected
/// when the message to be validated is not the first in the feed (ie. sequence number != 1
/// and previous != null).
///
/// The return type is a tuple of `Option<String>`. The first element of the tuple holds the key
/// (hash) of `msg_value` (if validation is successful) while the second element holds the error
/// messages (if validation fails). Only the key for `msg_value` is returned; the key for
/// `previous` is not.
///
/// Successful validation will yield a return value of `(Some<key>, None)` - where `key` is of type
/// `String`. Unsuccessful validation will yield a return value of `(None, Some<err_msg>)` - where
/// `err_msg` is of type `String` and includes the cause of the error and the offending message.
fn validate_single(
    hmac_key: Option<Vec<u8>>,
    message: String,
    previous: Option<String>,
) -> HandlerResult<String> {
    let valid_hmac = is_valid_hmac_key(hmac_key)?;

    let hmac = valid_hmac.as_deref();

    let msg_bytes = message.into_bytes();
    let previous_msg_bytes = previous.map(|msg| msg.into_bytes());

    // attempt verification and match on error to find invalid message
    match verify_message_value(&msg_bytes, hmac) {
        Ok(_) => (),
        Err(e) => {
            let invalid_msg_str = std::str::from_utf8(&msg_bytes).unwrap_or(
                "unable to convert invalid message bytes to string slice; not valid utf8",
            );
            let err_msg = format!("found invalid message: {}: {}", e, invalid_msg_str);
            return Err(err_msg.into());
        }
    };

    // attempt validation and match on error to find invalid message
    match validate_message_value_hash_chain(&msg_bytes, previous_msg_bytes) {
        Ok(_) => (),
        Err(e) => {
            let invalid_msg_str = std::str::from_utf8(&msg_bytes).unwrap_or(
                "unable to convert invalid message bytes to string slice; not valid utf8",
            );
            let err_msg = format!("found invalid message: {}: {}", e, invalid_msg_str);
            return Err(err_msg.into());
        }
    }

    // generate multihah from message value bytes
    let multihash = utils::multihash_from_bytes(&msg_bytes);
    let key = multihash.to_legacy_string();
    Ok(key)
}

/// Verify signatures and perform validation for an array of ordered message values by a single
/// author (includes HMAC key support).
///
/// Takes an HMAC key as the first argument, an array of message values as the second argument
/// and an optional previous message value as the third argument. The HMAC key must be of type
/// `ArrayBuffer`. Message signatures are verified without an HMAC key if the value of the
/// argument is `null` or `undefined` (maps to a `None` value). The previous message argument
/// is expected when the array of messages does not start from the beginning of the feed
/// (ie. sequence number != 1 and previous != null). If verification or validation fails, the
/// cause of the error is returned along with the offending message.
fn validate_batch(
    hmac_key: Option<Vec<u8>>,
    elements: Vec<String>,
    previous: Option<String>,
) -> HandlerResult<Vec<String>> {
    let valid_hmac = is_valid_hmac_key(hmac_key)?;

    let hmac = valid_hmac.as_deref();

    let mut msgs = Vec::new();
    for msg in elements {
        let msg_bytes = msg.into_bytes();
        msgs.push(msg_bytes)
    }

    let previous_msg = previous.map(|msg| msg.into_bytes());

    // we're not running parallel verification here due to rayon issues for wasm:
    // a dependency uses older versions of `rand` and `getrandom`, which fail to provide
    // `thread_rng` when parallel verification is attempted in the browser.
    for msg_bytes in &msgs {
        // attempt verification and match on error to find invalid message
        match verify_message_value(&msg_bytes, hmac) {
            Ok(_) => (),
            Err(e) => {
                let invalid_msg_str = std::str::from_utf8(msg_bytes).unwrap_or(
                    "unable to convert invalid message bytes to string slice; not valid utf8",
                );
                let err_msg = format!("found invalid message: {}: {}", e, invalid_msg_str);
                return Err(err_msg.into());
            }
        };
    }

    // attempt batch validation and match on error to find invalid message
    match par_validate_message_value_hash_chain_of_feed(&msgs, previous_msg.as_ref()) {
        Ok(_) => (),
        Err(e) => {
            let invalid_msg = &msgs
                .iter()
                .find(|msg| validate_message_value_hash_chain(msg, previous_msg.as_ref()).is_err());
            let invalid_msg_str = match invalid_msg {
                Some(msg) => std::str::from_utf8(msg).unwrap_or(
                    "unable to convert invalid message bytes to string slice; not valid utf8",
                ),
                None => "parallel validation failed but no single invalid message was found",
            };
            let err_msg = format!("found invalid message: {}: {}", e, invalid_msg_str);
            return Err(err_msg.into());
        }
    }

    let keys = hash(msgs);
    Ok(keys)
}

/// Verify signatures and perform validation for an array of out-of-order messages by a single
/// author (includes HMAC key support).
///
/// Takes an HMAC key as the first argument and an array of messages as the second argument.
/// The HMAC key must be of type `ArrayBuffer`. Message signatures are verified without an
/// HMAC key if the value of the argument is `null` or `undefined` (maps to a `None` value).
/// If verification or validation fails, the cause of the error is returned along with the
/// offending message.
fn validate_ooo_batch(
    hmac_key: Option<Vec<u8>>,
    elements: Vec<String>,
) -> HandlerResult<Vec<String>> {
    let valid_hmac = is_valid_hmac_key(hmac_key)?;

    let hmac = valid_hmac.as_deref();

    let mut msgs = Vec::new();
    for msg in elements {
        let msg_bytes = msg.into_bytes();
        msgs.push(msg_bytes)
    }

    for msg_bytes in &msgs {
        // attempt verification and match on error to find invalid message
        match verify_message_value(&msg_bytes, hmac) {
            Ok(_) => (),
            Err(e) => {
                let invalid_msg_str = std::str::from_utf8(msg_bytes).unwrap_or(
                    "unable to convert invalid message bytes to string slice; not valid utf8",
                );
                let err_msg = format!("found invalid message: {}: {}", e, invalid_msg_str);
                return Err(err_msg.into());
            }
        };
    }

    // attempt batch validation and match on error to find invalid message
    // TODO: do we really not care about the previous msg here?!
    match par_validate_ooo_message_value_hash_chain_of_feed::<_, &[u8]>(&msgs, None) {
        Ok(_) => (),
        Err(e) => {
            let invalid_msg = &msgs
                .iter()
                .find(|msg| validate_ooo_message_value_hash_chain::<_, &[u8]>(msg, None).is_err());
            let invalid_msg_str = match invalid_msg {
                Some(msg) => std::str::from_utf8(msg).unwrap_or(
                    "unable to convert invalid message bytes to string slice; not valid utf8",
                ),
                None => "parallel validation failed but no single invalid message was found",
            };
            let err_msg = format!("found invalid message: {}: {}", e, invalid_msg_str);
            return Err(err_msg.into());
        }
    }

    let keys = hash(msgs);
    Ok(keys)
}

/// Verify signatures and perform validation for an array of out-of-order messages by multiple
/// authors (includes HMAC key support).
///
/// Takes an HMAC key as the first argument and an array of messages as the second argument.
/// The HMAC key must be of type `ArrayBuffer`. Message signatures are verified without an
/// HMAC key if the value of the argument is `null` or `undefined` (maps to a `None` value).
/// If verification or validation fails, the cause of the error is returned along with the
/// offending message.
fn validate_multi_author_batch(
    hmac_key: Option<Vec<u8>>,
    elements: Vec<String>,
) -> HandlerResult<Vec<String>> {
    let valid_hmac = is_valid_hmac_key(hmac_key)?;
    let hmac = valid_hmac.as_deref();

    let mut msgs = Vec::new();
    for msg in elements {
        let msg_bytes = msg.into_bytes();
        msgs.push(msg_bytes)
    }

    for msg_bytes in &msgs {
        // attempt verification and match on error to find invalid message
        match verify_message_value(&msg_bytes, hmac) {
            Ok(_) => (),
            Err(e) => {
                let invalid_msg_str = std::str::from_utf8(msg_bytes).unwrap_or(
                    "unable to convert invalid message bytes to string slice; not valid utf8",
                );
                let err_msg = format!("found invalid message: {}: {}", e, invalid_msg_str);
                return Err(err_msg.into());
            }
        };
    }

    // attempt batch validation and match on error to find invalid message
    match par_validate_message_value(&msgs) {
        Ok(_) => (),
        Err(e) => {
            let invalid_msg = &msgs.iter().find(|msg| validate_message_value(msg).is_err());
            let invalid_msg_str = match invalid_msg {
                Some(msg) => std::str::from_utf8(msg).unwrap_or(
                    "unable to convert invalid message bytes to string slice; not valid utf8",
                ),
                None => "parallel validation failed but no single invalid message was found",
            };
            let err_msg = format!("found invalid message: {}: {}", e, invalid_msg_str);
            return Err(err_msg.into());
        }
    }

    let keys = hash(msgs);
    Ok(keys)
}

#[cfg(test)]
mod tests {
    use super::*;

    static HMAC_KEY2: &[u8; 32] =
        binary_macros::base64!("CbwuwYXmZgN7ZSuycCXoKGOTU1dGwBex+paeA2kr37U=");

    static VALID_HMAC: &str = include_str!("../test/data/validHmac.json");
    static VALID_HMAC_KEY: &str = include_str!("../test/data/validHmacKey.json");

    #[test]
    fn test() -> HandlerResult<()> {
        let result = verify_signatures(Some(HMAC_KEY2.to_vec()), vec![VALID_HMAC.to_owned()])?;
        let valid = serde_json::from_str::<String>(VALID_HMAC_KEY).unwrap();
        assert_eq!(result, vec![valid]);
        Ok(())
    }
}
