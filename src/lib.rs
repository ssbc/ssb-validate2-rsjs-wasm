// SPDX-License-Identifier: AGPL-3.0-only

use ssb_validate::{
    message_value::{
        par_validate_message_value, par_validate_message_value_hash_chain_of_feed,
        par_validate_ooo_message_value_hash_chain_of_feed, validate_message_value,
        validate_message_value_hash_chain, validate_ooo_message_value_hash_chain,
    },
    utils,
};
use ssb_verify_signatures::verify_message_value;
use wasm_bindgen::prelude::*;
pub use wasm_bindgen_rayon::init_thread_pool;

fn hash(msgs: Vec<Vec<u8>>) -> Vec<String> {
    let mut keys = Vec::new();
    for msg in msgs {
        let multihash = utils::multihash_from_bytes(&msg);
        let key = multihash.to_legacy_string();
        keys.push(key);
    }
    keys
}

/// Verify signatures for an array of messages.
///
/// Takes an array of messages as the only argument. If verification fails, the cause of the error
/// is returned along with the offending message. Note: this method only verifies message signatures;
/// it does not perform full message validation (use `verify_validate_message_array` for complete
/// verification and validation).
#[wasm_bindgen(js_name = verifySignatures)]
pub fn verify_messages(array: JsValue) -> JsValue {
    let elements: Vec<String> = array.into_serde().unwrap();
    let mut msgs = Vec::new();
    for msg in elements {
        let msg_bytes = msg.into_bytes();
        msgs.push(msg_bytes)
    }

    for msg_bytes in &msgs {
        // attempt verification and match on error to find invalid message
        match verify_message_value(&msg_bytes) {
            Ok(_) => (),
            Err(e) => {
                let invalid_msg_str = std::str::from_utf8(msg_bytes).unwrap();
                let err_msg = format!("found invalid message: {}: {}", e, invalid_msg_str);
                //return (Some(err_msg), None);
                let response: (Option<String>, Option<Vec<String>>) = (Some(err_msg), None);
                return JsValue::from_serde(&response).unwrap();
            }
        };
    }

    let keys = hash(msgs);
    let response: (Option<String>, Option<Vec<String>>) = (None, Some(keys));
    JsValue::from_serde(&response).unwrap()
}

/// Verify signature and perform validation for a single message.
///
/// Takes a message as the first argument and an optional previous message as the second
/// argument. The previous message argument is expected when the message to be validated is not the
/// first in the feed (ie. sequence number != 1 and previous != null). If
/// verification or validation fails, the cause of the error is returned along with the offending
/// message.
#[wasm_bindgen(js_name = validateSingle)]
pub fn verify_validate_message(message: String, previous: Option<String>) -> JsValue {
    let msg_bytes = message.into_bytes();
    let previous_msg_bytes = previous.map(|msg| msg.into_bytes());

    // attempt verification and match on error to find invalid message
    match verify_message_value(&msg_bytes) {
        Ok(_) => (),
        Err(e) => {
            let invalid_msg_str = std::str::from_utf8(&msg_bytes).unwrap();
            let err_msg = format!("found invalid message: {}: {}", e, invalid_msg_str);
            let response: (Option<String>, Option<Vec<String>>) = (Some(err_msg), None);
            return JsValue::from_serde(&response).unwrap();
        }
    };

    // attempt validation and match on error to find invalid message
    match validate_message_value_hash_chain(&msg_bytes, previous_msg_bytes) {
        Ok(_) => (),
        Err(e) => {
            let invalid_msg_str = std::str::from_utf8(&msg_bytes).unwrap();
            let err_msg = format!("found invalid message: {}: {}", e, invalid_msg_str);
            let response: (Option<String>, Option<Vec<String>>) = (Some(err_msg), None);
            return JsValue::from_serde(&response).unwrap();
        }
    }

    // generate multihah from message value bytes
    let multihash = utils::multihash_from_bytes(&msg_bytes);
    let key = multihash.to_legacy_string();
    let response: (Option<String>, Option<String>) = (None, Some(key));
    JsValue::from_serde(&response).unwrap()
}

/// Verify signatures and perform validation for an array of ordered messages by a single author.
///
/// Takes an array of messages as the first argument and an optional previous message as the second
/// argument. The previous message argument is expected when the array of messages does not start
/// from the beginning of the feed (ie. sequence number != 1 and previous != null). If
/// verification or validation fails, the cause of the error is returned along with the offending
/// message.
#[wasm_bindgen(js_name = validateBatch)]
pub fn verify_validate_messages(array: JsValue, previous: Option<String>) -> JsValue {
    let elements: Vec<String> = array.into_serde().unwrap();
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
        match verify_message_value(&msg_bytes) {
            Ok(_) => (),
            Err(e) => {
                let invalid_msg_str = std::str::from_utf8(msg_bytes).unwrap();
                let err_msg = format!("found invalid message: {}: {}", e, invalid_msg_str);
                let response: (Option<String>, Option<Vec<String>>) = (Some(err_msg), None);
                return JsValue::from_serde(&response).unwrap();
            }
        };
    }

    // attempt batch validation and match on error to find invalid message
    match par_validate_message_value_hash_chain_of_feed(&msgs, previous_msg.as_ref()) {
        Ok(_) => (),
        Err(e) => {
            let invalid_message = &msgs
                .iter()
                .find(|msg| validate_message_value_hash_chain(msg, previous_msg.as_ref()).is_err())
                .unwrap();
            let invalid_msg_str = std::str::from_utf8(invalid_message).unwrap();
            let err_msg = format!("found invalid message: {}: {}", e, invalid_msg_str);
            let response: (Option<String>, Option<Vec<String>>) = (Some(err_msg), None);
            return JsValue::from_serde(&response).unwrap();
        }
    }

    let keys = hash(msgs);
    let response: (Option<String>, Option<Vec<String>>) = (None, Some(keys));
    JsValue::from_serde(&response).unwrap()
}

/// Verify signatures and perform validation for an array of out-of-order messages by a single
/// author.
///
/// Takes an array of messages as the only argument. If verification or validation fails, the
/// cause of the error is returned along with the offending message.
#[wasm_bindgen(js_name = validateOOOBatch)]
pub fn verify_validate_out_of_order_messages(array: JsValue) -> JsValue {
    let elements: Vec<String> = array.into_serde().unwrap();
    let mut msgs = Vec::new();
    for msg in elements {
        let msg_bytes = msg.into_bytes();
        msgs.push(msg_bytes)
    }

    for msg_bytes in &msgs {
        // attempt verification and match on error to find invalid message
        match verify_message_value(&msg_bytes) {
            Ok(_) => (),
            Err(e) => {
                let invalid_msg_str = std::str::from_utf8(msg_bytes).unwrap();
                let err_msg = format!("found invalid message: {}: {}", e, invalid_msg_str);
                let response: (Option<String>, Option<Vec<String>>) = (Some(err_msg), None);
                return JsValue::from_serde(&response).unwrap();
            }
        };
    }

    // attempt batch validation and match on error to find invalid message
    // TODO: do we really not care about the previous msg here?!
    match par_validate_ooo_message_value_hash_chain_of_feed::<_, &[u8]>(&msgs, None) {
        Ok(_) => (),
        Err(e) => {
            let invalid_message = &msgs
                .iter()
                .find(|msg| validate_ooo_message_value_hash_chain::<_, &[u8]>(msg, None).is_err())
                .unwrap();
            let invalid_msg_str = std::str::from_utf8(invalid_message).unwrap();
            let err_msg = format!("found invalid message: {}: {}", e, invalid_msg_str);
            let response: (Option<String>, Option<Vec<String>>) = (Some(err_msg), None);
            return JsValue::from_serde(&response).unwrap();
        }
    }

    let keys = hash(msgs);
    let response: (Option<String>, Option<Vec<String>>) = (None, Some(keys));
    JsValue::from_serde(&response).unwrap()
}

/// Verify signatures and perform validation for an array of out-of-order messages by multiple
/// authors.
///
/// Takes an array of messages as the only argument. If verification or validation fails, the
/// cause of the error is returned along with the offending message.
#[wasm_bindgen(js_name = validateMultiAuthorBatch)]
pub fn verify_validate_multi_author_messages(array: JsValue) -> JsValue {
    let elements: Vec<String> = array.into_serde().unwrap();
    let mut msgs = Vec::new();
    for msg in elements {
        let msg_bytes = msg.into_bytes();
        msgs.push(msg_bytes)
    }

    for msg_bytes in &msgs {
        // attempt verification and match on error to find invalid message
        match verify_message_value(&msg_bytes) {
            Ok(_) => (),
            Err(e) => {
                let invalid_msg_str = std::str::from_utf8(msg_bytes).unwrap();
                let err_msg = format!("found invalid message: {}: {}", e, invalid_msg_str);
                let response: (Option<String>, Option<Vec<String>>) = (Some(err_msg), None);
                return JsValue::from_serde(&response).unwrap();
            }
        };
    }

    // attempt batch validation and match on error to find invalid message
    match par_validate_message_value(&msgs) {
        Ok(_) => (),
        Err(e) => {
            let invalid_message = &msgs
                .iter()
                .find(|msg| validate_message_value(msg).is_err())
                .unwrap();
            let invalid_msg_str = std::str::from_utf8(invalid_message).unwrap();
            let err_msg = format!("found invalid message: {}: {}", e, invalid_msg_str);
            let response: (Option<String>, Option<Vec<String>>) = (Some(err_msg), None);
            return JsValue::from_serde(&response).unwrap();
        }
    }

    let keys = hash(msgs);
    let response: (Option<String>, Option<Vec<String>>) = (None, Some(keys));
    JsValue::from_serde(&response).unwrap()
}
