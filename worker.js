import {
  ready,
  verifySignatures as verifySignaturesWrapper,
  validateSingle as validateSingleWrapper,
  validateBatch as validateBatchWrapper,
  validateOOOBatch as validateOOOBatchWrapper,
  validateMultiAuthorBatch as validateMultiAuthorBatchWrapper,
} from "./index.js";
import * as Comlink from "./comlink.mjs";

// define a class which will be exposed to `main.js` via comlink
class Validator {
  constructor() {
    console.log("constructor fired");
  }

  async ready() {
    // load the wasm module and initialize the worker threadpool
    await ready();
    console.log("wasm initialized");
  }

  verifySignatures(msgs) {
    return verifySignaturesWrapper(msgs);
  }

  validateSingle(msg, previous) {
    return validateSingleWrapper(msg, previous);
  }

  validateBatch(msgs, previous) {
    return validateBatchWrapper(msgs, previous);
  }

  validateOOOBatch(msgs) {
    return validateOOOBatchWrapper(msgs);
  }

  validateMultiAuthorBatch(msgs) {
    return validateMultiAuthorBatchWrapper(msgs);
  }
}

Comlink.expose(Validator);
