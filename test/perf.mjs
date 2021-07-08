import * as Comlink from "comlink";
import singleAuthorMsgs from "./data/singleAuthorMsgs.js";
import msgValues7000 from "./data/msgValues7000.js";
import singleAuthorMsgsKeys from "./data/singleAuthorMsgsKeys.js";
import multiAuthorMsgs from "./data/multiAuthorMsgs.js";
import validMsg from "./data/valid.js";
import validMsgKey from "./data/validKey.js";
import validHmacMsg from "./data/validHmac.js";
import validHmacMsgKey from "./data/validHmacKey.js";

// "The buffer module from node.js, for the browser"
//const Buffer = require('buffer/').Buffer;

// We can't just require ../index because Karma doesn't bundle `new Worker`
// In Chrome this may work, but we also want to support Firefox
const wrapped = Comlink.wrap(
  new Worker(new URL("../test-dist/main.js", import.meta.url))
);

const validate = {
  ready(cb) {
    wrapped.ready().then(cb);
  },

  verifySignatures(hmacKey, msgs, cb) {
    wrapped.verifySignatures(hmacKey, msgs).then(([err, res]) => cb(err, res));
  },

  validateSingle(hmacKey, msg, previous, cb) {
    if (previous) {
      wrapped
        .validateSingle(hmacKey, msg, previous)
        .then(([err, res]) => cb(err, res));
    } else {
      wrapped.validateSingle(hmacKey, msg).then(([err, res]) => cb(err, res));
    }
  },

  validateBatch(hmacKey, msgs, previous, cb) {
    if (previous) {
      wrapped
        .validateBatch(hmacKey, msgs, previous)
        .then(([err, res]) => cb(err, res));
    } else {
      wrapped.validateBatch(hmacKey, msgs).then(([err, res]) => cb(err, res));
    }
  },

  validateOOOBatch(hmacKey, msgs, cb) {
    wrapped.validateOOOBatch(hmacKey, msgs).then(([err, res]) => cb(err, res));
  },

  validateMultiAuthorBatch(hmacKey, msgs, cb) {
    wrapped
      .validateMultiAuthorBatch(hmacKey, msgs)
      .then(([err, res]) => cb(err, res));
  },
};

const hmacKey1 = null;
const hmacKey2 = 'CbwuwYXmZgN7ZSuycCXoKGOTU1dGwBex+paeA2kr37U=';

describe("test: ", function () {
  before(function (done) {
    this.timeout(10e3);
    // load wasm module and initialize webworkers
    validate.ready(done);
  });

  it("batch validation of full feed", function (done) {
    console.log("[ BATCH VALIDATION ( 7000 ) ]");
    console.time("TOTAL: validateBatch");
    validate.validateBatch(hmacKey1, msgValues7000, null, (err, res) => {
      console.timeEnd("TOTAL: validateBatch");
      const isEqual =
        JSON.stringify(singleAuthorMsgsKeys) === JSON.stringify(res);
      if (!err && isEqual) done();
      else done("failed");
    });
  });
});
