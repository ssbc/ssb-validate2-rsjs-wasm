import {
  default as init,
  initThreadPool,
  verifySignatures as verifySignaturesWasm,
  validateSingle as validateSingleWasm,
  validateBatch as validateBatchWasm,
  validateOOOBatch as validateOOOBatchWasm,
  validateMultiAuthorBatch as validateMultiAuthorBatchWasm,
} from "./pkg/ssb_validate2_rsjs_wasm.js";

// "The buffer module from node.js, for the browser"
const Buffer = require('buffer/').Buffer;

const stringify = (msg) => JSON.stringify(msg, null, 2);

const verifySignatures = (hmacKey, msgs) => {
  if (!Array.isArray(msgs)) return "input must be an array of message objects";
  const jsonMsgs = msgs.map(stringify);
  let hmacVal;
  if (!hmacKey) {
    hmacVal = null;
  } else {
    hmacVal = Buffer.isBuffer(hmacKey)
      ? hmacKey
      : Buffer.from(hmacKey, "base64");
    if (typeof hmacKey === "string") {
      if (hmacVal.toString("base64") !== hmacKey)
        return "hmac key invalid: string must be base64 encoded";
    }
  }
  return verifySignaturesWasm(hmacVal, jsonMsgs);
};

const validateSingle = (hmacKey, msg, previous) => {
  const jsonMsg = stringify(msg);
  let hmacVal;
  if (!hmacKey) {
    hmacVal = null;
  } else {
    hmacVal = Buffer.isBuffer(hmacKey)
      ? hmacKey
      : Buffer.from(hmacKey, "base64");
    if (typeof hmacKey === "string") {
      if (hmacVal.toString("base64") !== hmacKey)
        return "hmac key invalid: string must be base64 encoded";
    }
  }
  if (previous) {
    const jsonPrevious = stringify(previous);
    // `result` is a string of the hash (`key`) for the given `jsonMsg` value
    return validateSingleWasm(hmacVal, jsonMsg, jsonPrevious);
  }
  return validateSingleWasm(hmacVal, jsonMsg);
};

const validateBatch = (hmacKey, msgs, previous) => {
  if (!Array.isArray(msgs)) return "input must be an array of message objects";
  const jsonMsgs = msgs.map(stringify);
  let hmacVal;
  if (!hmacKey) {
    hmacVal = null;
  } else {
    hmacVal = Buffer.isBuffer(hmacKey)
      ? hmacKey
      : Buffer.from(hmacKey, "base64");
    if (typeof hmacKey === "string") {
      if (hmacVal.toString("base64") !== hmacKey)
        return "hmac key invalid: string must be base64 encoded";
    }
  }
  if (previous) {
    const jsonPrevious = stringify(previous);
    // `result` is an array of strings (each string a `key`) for the given `jsonMsgs`
    return validateBatchWasm(hmacVal, jsonMsgs, jsonPrevious);
  }
  return validateBatchWasm(hmacVal, jsonMsgs);
};

const validateOOOBatch = (hmacKey, msgs) => {
  if (!Array.isArray(msgs)) return "input must be an array of message objects";
  const jsonMsgs = msgs.map(stringify);
  let hmacVal;
  if (!hmacKey) {
    hmacVal = null;
  } else {
    hmacVal = Buffer.isBuffer(hmacKey)
      ? hmacKey
      : Buffer.from(hmacKey, "base64");
    if (typeof hmacKey === "string") {
      if (hmacVal.toString("base64") !== hmacKey)
        return "hmac key invalid: string must be base64 encoded";
    }
  }
  return validateOOOBatchWasm(hmacVal, jsonMsgs);
};

const validateMultiAuthorBatch = (hmacKey, msgs) => {
  if (!Array.isArray(msgs)) return "input must be an array of message objects";
  const jsonMsgs = msgs.map(stringify);
  let hmacVal;
  if (!hmacKey) {
    hmacVal = null;
  } else {
    hmacVal = Buffer.isBuffer(hmacKey)
      ? hmacKey
      : Buffer.from(hmacKey, "base64");
    if (typeof hmacKey === "string") {
      if (hmacVal.toString("base64") !== hmacKey)
        return "hmac key invalid: string must be base64 encoded";
    }
  }
  return validateMultiAuthorBatchWasm(hmacVal, jsonMsgs);
};

/*
 * Initialize the WASM module and WebWorkers.
 * The WebWorkers are used as threads for parallel validation.
 * One thread is created for each processor core.
 */
const ready = async () => {
  await init();
  await initThreadPool(navigator.hardwareConcurrency);
};

export {
  verifySignatures,
  validateSingle,
  validateBatch,
  validateOOOBatch,
  validateMultiAuthorBatch,
  ready,
};
