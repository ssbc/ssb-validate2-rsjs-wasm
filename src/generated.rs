extern crate rmp_serde as rmps;
use rmps::{Deserializer, Serializer};
use serde::{Deserialize, Serialize};
use std::io::Cursor;

#[cfg(feature = "guest")]
extern crate wapc_guest as guest;
#[cfg(feature = "guest")]
use guest::prelude::*;

#[cfg(feature = "guest")]
pub struct Host {
    binding: String,
}

#[cfg(feature = "guest")]
impl Default for Host {
    fn default() -> Self {
        Host {
            binding: "default".to_string(),
        }
    }
}

/// Creates a named host binding
#[cfg(feature = "guest")]
pub fn host(binding: &str) -> Host {
    Host {
        binding: binding.to_string(),
    }
}

/// Creates the default host binding
#[cfg(feature = "guest")]
pub fn default() -> Host {
    Host::default()
}

#[cfg(feature = "guest")]
impl Host {
    pub fn verify_signatures(
        &self,
        hmac_key: Option<Vec<u8>>,
        array: Vec<String>,
    ) -> HandlerResult<Vec<String>> {
        let input_args = VerifySignaturesArgs { hmac_key, array };
        host_call(
            &self.binding,
            "ssb-validate2",
            "verifySignatures",
            &serialize(input_args)?,
        )
        .map(|vec| {
            let resp = deserialize::<Vec<String>>(vec.as_ref()).unwrap();
            resp
        })
        .map_err(|e| e.into())
    }
    pub fn validate_single(
        &self,
        hmac_key: Option<Vec<u8>>,
        message: String,
        previous: Option<String>,
    ) -> HandlerResult<String> {
        let input_args = ValidateSingleArgs {
            hmac_key,
            message,
            previous,
        };
        host_call(
            &self.binding,
            "ssb-validate2",
            "validateSingle",
            &serialize(input_args)?,
        )
        .map(|vec| {
            let resp = deserialize::<String>(vec.as_ref()).unwrap();
            resp
        })
        .map_err(|e| e.into())
    }
    pub fn validate_batch(
        &self,
        hmac_key: Option<Vec<u8>>,
        array: Vec<String>,
        previous: Option<String>,
    ) -> HandlerResult<Vec<String>> {
        let input_args = ValidateBatchArgs {
            hmac_key,
            array,
            previous,
        };
        host_call(
            &self.binding,
            "ssb-validate2",
            "validateBatch",
            &serialize(input_args)?,
        )
        .map(|vec| {
            let resp = deserialize::<Vec<String>>(vec.as_ref()).unwrap();
            resp
        })
        .map_err(|e| e.into())
    }
    pub fn validate_ooo_batch(
        &self,
        hmac_key: Option<Vec<u8>>,
        array: Vec<String>,
    ) -> HandlerResult<Vec<String>> {
        let input_args = ValidateOOOBatchArgs { hmac_key, array };
        host_call(
            &self.binding,
            "ssb-validate2",
            "validateOOOBatch",
            &serialize(input_args)?,
        )
        .map(|vec| {
            let resp = deserialize::<Vec<String>>(vec.as_ref()).unwrap();
            resp
        })
        .map_err(|e| e.into())
    }
    pub fn validate_multi_author_batch(
        &self,
        hmac_key: Option<Vec<u8>>,
        array: Vec<String>,
    ) -> HandlerResult<Vec<String>> {
        let input_args = ValidateMultiAuthorBatchArgs { hmac_key, array };
        host_call(
            &self.binding,
            "ssb-validate2",
            "validateMultiAuthorBatch",
            &serialize(input_args)?,
        )
        .map(|vec| {
            let resp = deserialize::<Vec<String>>(vec.as_ref()).unwrap();
            resp
        })
        .map_err(|e| e.into())
    }
}

#[cfg(feature = "guest")]
pub struct Handlers {}

#[cfg(feature = "guest")]
impl Handlers {
    pub fn register_verify_signatures(
        f: fn(Option<Vec<u8>>, Vec<String>) -> HandlerResult<Vec<String>>,
    ) {
        *VERIFY_SIGNATURES.write().unwrap() = Some(f);
        register_function(&"verifySignatures", verify_signatures_wrapper);
    }
    pub fn register_validate_single(
        f: fn(Option<Vec<u8>>, String, Option<String>) -> HandlerResult<String>,
    ) {
        *VALIDATE_SINGLE.write().unwrap() = Some(f);
        register_function(&"validateSingle", validate_single_wrapper);
    }
    pub fn register_validate_batch(
        f: fn(Option<Vec<u8>>, Vec<String>, Option<String>) -> HandlerResult<Vec<String>>,
    ) {
        *VALIDATE_BATCH.write().unwrap() = Some(f);
        register_function(&"validateBatch", validate_batch_wrapper);
    }
    pub fn register_validate_ooo_batch(
        f: fn(Option<Vec<u8>>, Vec<String>) -> HandlerResult<Vec<String>>,
    ) {
        *VALIDATE_OOO_BATCH.write().unwrap() = Some(f);
        register_function(&"validateOOOBatch", validate_ooo_batch_wrapper);
    }
    pub fn register_validate_multi_author_batch(
        f: fn(Option<Vec<u8>>, Vec<String>) -> HandlerResult<Vec<String>>,
    ) {
        *VALIDATE_MULTI_AUTHOR_BATCH.write().unwrap() = Some(f);
        register_function(
            &"validateMultiAuthorBatch",
            validate_multi_author_batch_wrapper,
        );
    }
}

#[cfg(feature = "guest")]
lazy_static::lazy_static! {
static ref VERIFY_SIGNATURES: std::sync::RwLock<Option<fn(Option<Vec<u8>>, Vec<String>) -> HandlerResult<Vec<String>>>> = std::sync::RwLock::new(None);
static ref VALIDATE_SINGLE: std::sync::RwLock<Option<fn(Option<Vec<u8>>, String, Option<String>) -> HandlerResult<String>>> = std::sync::RwLock::new(None);
static ref VALIDATE_BATCH: std::sync::RwLock<Option<fn(Option<Vec<u8>>, Vec<String>, Option<String>) -> HandlerResult<Vec<String>>>> = std::sync::RwLock::new(None);
static ref VALIDATE_OOO_BATCH: std::sync::RwLock<Option<fn(Option<Vec<u8>>, Vec<String>) -> HandlerResult<Vec<String>>>> = std::sync::RwLock::new(None);
static ref VALIDATE_MULTI_AUTHOR_BATCH: std::sync::RwLock<Option<fn(Option<Vec<u8>>, Vec<String>) -> HandlerResult<Vec<String>>>> = std::sync::RwLock::new(None);
}

#[cfg(feature = "guest")]
fn verify_signatures_wrapper(input_payload: &[u8]) -> CallResult {
    let input = deserialize::<VerifySignaturesArgs>(input_payload)?;
    let lock = VERIFY_SIGNATURES.read().unwrap().unwrap();
    let result = lock(input.hmac_key, input.array)?;
    serialize(result)
}

#[cfg(feature = "guest")]
fn validate_single_wrapper(input_payload: &[u8]) -> CallResult {
    let input = deserialize::<ValidateSingleArgs>(input_payload)?;
    let lock = VALIDATE_SINGLE.read().unwrap().unwrap();
    let result = lock(input.hmac_key, input.message, input.previous)?;
    serialize(result)
}

#[cfg(feature = "guest")]
fn validate_batch_wrapper(input_payload: &[u8]) -> CallResult {
    let input = deserialize::<ValidateBatchArgs>(input_payload)?;
    let lock = VALIDATE_BATCH.read().unwrap().unwrap();
    let result = lock(input.hmac_key, input.array, input.previous)?;
    serialize(result)
}

#[cfg(feature = "guest")]
fn validate_ooo_batch_wrapper(input_payload: &[u8]) -> CallResult {
    let input = deserialize::<ValidateOOOBatchArgs>(input_payload)?;
    let lock = VALIDATE_OOO_BATCH.read().unwrap().unwrap();
    let result = lock(input.hmac_key, input.array)?;
    serialize(result)
}

#[cfg(feature = "guest")]
fn validate_multi_author_batch_wrapper(input_payload: &[u8]) -> CallResult {
    let input = deserialize::<ValidateMultiAuthorBatchArgs>(input_payload)?;
    let lock = VALIDATE_MULTI_AUTHOR_BATCH.read().unwrap().unwrap();
    let result = lock(input.hmac_key, input.array)?;
    serialize(result)
}

#[derive(Debug, PartialEq, Deserialize, Serialize, Default, Clone)]
pub struct VerifySignaturesArgs {
    #[serde(with = "serde_bytes")]
    #[serde(rename = "hmacKey")]
    pub hmac_key: Option<Vec<u8>>,
    #[serde(rename = "array")]
    pub array: Vec<String>,
}

#[derive(Debug, PartialEq, Deserialize, Serialize, Default, Clone)]
pub struct ValidateSingleArgs {
    #[serde(with = "serde_bytes")]
    #[serde(rename = "hmacKey")]
    pub hmac_key: Option<Vec<u8>>,
    #[serde(rename = "message")]
    pub message: String,
    #[serde(rename = "previous")]
    pub previous: Option<String>,
}

#[derive(Debug, PartialEq, Deserialize, Serialize, Default, Clone)]
pub struct ValidateBatchArgs {
    #[serde(with = "serde_bytes")]
    #[serde(rename = "hmacKey")]
    pub hmac_key: Option<Vec<u8>>,
    #[serde(rename = "array")]
    pub array: Vec<String>,
    #[serde(rename = "previous")]
    pub previous: Option<String>,
}

#[derive(Debug, PartialEq, Deserialize, Serialize, Default, Clone)]
pub struct ValidateOOOBatchArgs {
    #[serde(with = "serde_bytes")]
    #[serde(rename = "hmacKey")]
    pub hmac_key: Option<Vec<u8>>,
    #[serde(rename = "array")]
    pub array: Vec<String>,
}

#[derive(Debug, PartialEq, Deserialize, Serialize, Default, Clone)]
pub struct ValidateMultiAuthorBatchArgs {
    #[serde(with = "serde_bytes")]
    #[serde(rename = "hmacKey")]
    pub hmac_key: Option<Vec<u8>>,
    #[serde(rename = "array")]
    pub array: Vec<String>,
}

/// The standard function for serializing codec structs into a format that can be
/// used for message exchange between actor and host. Use of any other function to
/// serialize could result in breaking incompatibilities.
pub fn serialize<T>(
    item: T,
) -> ::std::result::Result<Vec<u8>, Box<dyn std::error::Error + Send + Sync>>
where
    T: Serialize,
{
    let mut buf = Vec::new();
    item.serialize(&mut Serializer::new(&mut buf).with_struct_map())?;
    Ok(buf)
}

/// The standard function for de-serializing codec structs from a format suitable
/// for message exchange between actor and host. Use of any other function to
/// deserialize could result in breaking incompatibilities.
pub fn deserialize<'de, T: Deserialize<'de>>(
    buf: &[u8],
) -> ::std::result::Result<T, Box<dyn std::error::Error + Send + Sync>> {
    let mut de = Deserializer::new(Cursor::new(buf));
    match Deserialize::deserialize(&mut de) {
        Ok(t) => Ok(t),
        Err(e) => Err(format!("Failed to de-serialize: {}", e).into()),
    }
}
