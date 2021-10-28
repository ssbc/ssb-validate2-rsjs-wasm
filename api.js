// SPDX-FileCopyrightText: 2021 Andrew 'glyph' Reid
//
// SPDX-License-Identifier: LGPL-3.0-only

import { instantiateStreaming } from "@wapc/host";
import { encode } from "@msgpack/msgpack";

let host = undefined;

async function verifySignaturesWasm(hmacKey, array) {
  console.log(hmacKey, array);
  host.invoke("verifySignatures", encode({ hmacKey, array }));
}
async function validateSingleWasm(hmacKey, message, previous) {
  host.invoke("validateSingle", encode({ hmacKey, message, previous }));
}
async function validateBatchWasm(hmacKey, array, previous) {
  host.invoke("validateBatch", encode({ hmacKey, array, previous }));
}
async function validateOOOBatchWasm(hmacKey, array) {
  host.invoke("validateOOOBatch", encode({ hmacKey, array }));
}
async function validateMultiAuthorBatchWasm(hmacKey, array) {
  host.invoke("validateMultiAuthorBatch", encode({ hmacKey, array }));
}

// "The buffer module from node.js, for the browser"
const Buffer = require("buffer/").Buffer;

const stringify = (msg) => JSON.stringify(msg, null, 2);

const toBuffer = (hmacKey) => {
  let hmacVal;
  let err;
  if (!hmacKey) {
    hmacVal = null;
  } else {
    hmacVal = Buffer.isBuffer(hmacKey)
      ? hmacKey
      : Buffer.from(hmacKey, "base64");
    if (typeof hmacKey === "string") {
      if (hmacVal.toString("base64") !== hmacKey)
        err = "hmac key invalid: string must be base64 encoded";
    }
  }
  return [err, hmacVal];
};

const verifySignatures = (hmacKey, msgs) => {
  if (!Array.isArray(msgs)) return "input must be an array of message objects";
  const jsonMsgs = msgs.map(stringify);
  const [err, hmacVal] = toBuffer(hmacKey);
  if (err) return [err];
  return verifySignaturesWasm(hmacVal, jsonMsgs);
};

const validateSingle = (hmacKey, msg, previous) => {
  const jsonMsg = stringify(msg);
  const [err, hmacVal] = toBuffer(hmacKey);
  if (err) return [err];
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
  const [err, hmacVal] = toBuffer(hmacKey);
  if (err) return [err];
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
  const [err, hmacVal] = toBuffer(hmacKey);
  if (err) return [err];
  return validateOOOBatchWasm(hmacVal, jsonMsgs);
};

const validateMultiAuthorBatch = (hmacKey, msgs) => {
  if (!Array.isArray(msgs)) return "input must be an array of message objects";
  const jsonMsgs = msgs.map(stringify);
  const [err, hmacVal] = toBuffer(hmacKey);
  if (err) return [err];
  return validateMultiAuthorBatchWasm(hmacVal, jsonMsgs);
};

/*
 * Initialize the WASM module and WebWorkers.
 * The WebWorkers are used as threads for parallel validation.
 * One thread is created for each processor core.
 */
const ready = async () => {
  host = await instantiateStreaming(
    await fetch("./build/ssb_validate2_rsjs_wasm_wapc.wasm")
  );
};

export {
  verifySignatures,
  validateSingle,
  validateBatch,
  validateOOOBatch,
  validateMultiAuthorBatch,
  ready,
};
