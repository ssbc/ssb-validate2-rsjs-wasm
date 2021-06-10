import {
  default as init,
  initThreadPool,
  verifySignatures as verifySignaturesWasm,
  validateSingle as validateSingleWasm,
  validateBatch as validateBatchWasm,
  validateOOOBatch as validateOOOBatchWasm,
  validateMultiAuthorBatch as validateMultiAuthorBatchWasm,
} from "./pkg/ssb_validate2_rsjs_wasm.js";

const verifySignatures = (msgs) => {
  if (!Array.isArray(msgs)) return "input must be an array of message objects";
  const jsonMsgs = msgs.map((msg) => {
    return JSON.stringify(msg, null, 2);
  });
  return verifySignaturesWasm(jsonMsgs);
};

const validateSingle = (msg, previous) => {
  const jsonMsg = JSON.stringify(msg, null, 2);
  if (previous) {
    const jsonPrevious = JSON.stringify(previous, null, 2);
    return validateSingleWasm(jsonMsg, jsonPrevious);
  }
  return validateSingleWasm(jsonMsg);
};

const validateBatch = (msgs, previous) => {
  if (!Array.isArray(msgs)) return "input must be an array of message objects";
  const jsonMsgs = msgs.map((msg) => {
    return JSON.stringify(msg, null, 2);
  });
  if (previous) {
    const jsonPrevious = JSON.stringify(previous, null, 2);
    return validateBatchWasm(jsonMsgs, jsonPrevious);
  }
  return validateBatchWasm(jsonMsgs);
};

const validateOOOBatch = (msgs) => {
  if (!Array.isArray(msgs)) return "input must be an array of message objects";
  const jsonMsgs = msgs.map((msg) => {
    return JSON.stringify(msg, null, 2);
  });
  return validateOOOBatchWasm(jsonMsgs);
};

const validateMultiAuthorBatch = (msgs) => {
  if (!Array.isArray(msgs))
    throw new Error("input must be an array of message objects");
  const jsonMsgs = msgs.map((msg) => {
    return JSON.stringify(msg, null, 2);
  });
  return validateMultiAuthorBatchWasm(jsonMsgs);
};

/*
 * Initialize the WASM module and WebWorkers.
 * The WebWorkers are used as threads for parallel validation.
 * One thread is created for each processor core.
 */
const ready = async (cb) => {
  await init();
  await initThreadPool(navigator.hardwareConcurrency);

  if (cb) cb();
};

export {
  verifySignatures,
  validateSingle,
  validateBatch,
  validateOOOBatch,
  validateMultiAuthorBatch,
  ready,
};
