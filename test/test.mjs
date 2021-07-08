import * as Comlink from "comlink";
import singleAuthorMsgs from "./data/singleAuthorMsgs.js";
import singleAuthorMsgs7000 from "./data/singleAuthorMsgs7000.js";
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

  it("batch verification of message signatures", function (done) {
    console.log("[ BATCH VERIFICATION ]");
    const msgs = singleAuthorMsgs.map((msg) => msg.value);
    validate.verifySignatures(hmacKey1, msgs, (err, res) => {
      // ensure the pre-defined keys array matches the returned keys array
      const isEqual =
        JSON.stringify(singleAuthorMsgsKeys) === JSON.stringify(res);
      if (!err && isEqual) done();
      else done("failed");
    });
  });

  it("batch verification of out-of-order message signatures", function (done) {
    const msgs = singleAuthorMsgs.map((msg) => msg.value);
    const oooMsgs = [...msgs];
    // shuffle the messages (generate out-of-order state)
    oooMsgs.sort(() => Math.random() - 0.5);
    // attempt verification of all messages
    validate.verifySignatures(hmacKey1, oooMsgs, (err, res) => {
      if (!err) done();
      else done("failed");
    });
  });

  it("verification of single message signature (valid)", function (done) {
    let validMsgClone = JSON.parse(JSON.stringify(validMsg));
    let msgs = [validMsgClone.value];
    validate.verifySignatures(hmacKey1, msgs, (err, res) => {
      const isEqual = JSON.stringify(validMsgKey) === JSON.stringify(res);
      if (!err && isEqual) done();
      else done("failed");
    });
  });

  it("verification of single message signature (invalid)", function (done) {
    let invalidMsg = JSON.parse(JSON.stringify(validMsg));
    // change one of the msg fields to invalidate the signature
    invalidMsg.value.content.following = false;
    let msgs = [invalidMsg.value];
    validate.verifySignatures(hmacKey1, msgs, (err, res) => {
      if (err.includes("Signature was invalid")) done();
      else done("failed");
    });
  });

  it("verification of single message signature with hmac (string)", function (done) {
    let msgs = [validHmacMsg];
    validate.verifySignatures(hmacKey2, msgs, (err, res) => {
      const isEqual = JSON.stringify(validHmacMsgKey) === JSON.stringify(res);
      if (!err && isEqual) done();
      else done("failed");
    });
  });

  it("verification of single message signature with hmac (buffer)", function (done) {
    let msgs = [validHmacMsg];
    // create Uint8Array from base64 encoded string
    let hmacArray = Uint8Array.from(atob(hmacKey2), c => c.charCodeAt(0));
    // access ArrayBuffer from Uint8Array
    let hmacKeyBuf = hmacArray.buffer;
    validate.verifySignatures(hmacKeyBuf, msgs, (err, res) => {
      const isEqual = JSON.stringify(validHmacMsgKey) === JSON.stringify(res);
      if (!err && isEqual) done();
      else done("failed");
    });
  });

  it("validation of first message (`seq` == 1) without `previous`", function (done) {
    validate.validateSingle(
      hmacKey1,
      singleAuthorMsgs[0].value,
      null,
      (err, res) => {
        const isEqual =
          JSON.stringify(singleAuthorMsgsKeys[0]) === JSON.stringify(res);
        if (!err && isEqual) done();
        else done("failed");
      }
    );
  });

  it("validation of a single with `previous`", function (done) {
    validate.validateSingle(
      hmacKey1,
      singleAuthorMsgs[1].value,
      singleAuthorMsgs[0].value,
      (err, res) => {
        const isEqual =
          JSON.stringify(singleAuthorMsgsKeys[1]) === JSON.stringify(res);
        if (!err && isEqual) done();
        else done("failed");
      }
    );
  });

  it("validation of a single message (`seq` > 1) without `previous`", function (done) {
    validate.validateSingle(
      hmacKey1,
      singleAuthorMsgs[3].value,
      null,
      (err, res) => {
        if (err.includes("The first message of a feed must have seq of 1"))
          done();
        else done("failed");
      }
    );
  });

  it("batch validation of full feed", function (done) {
    console.log("[ BATCH VALIDATION ( 7000 ) ]");
    const msgs = singleAuthorMsgs7000.map((msg) => msg.value);
    console.time("TEST: calling validateBatch");
    validate.validateBatch(hmacKey1, msgs, null, (err, res) => {
      console.timeEnd("TEST: calling validateBatch");
      const isEqual =
        JSON.stringify(singleAuthorMsgsKeys) === JSON.stringify(res);
      if (!err && isEqual) done();
      else done("failed");
    });
  });

  it("batch validation of partial feed (previous seq == 1)", function (done) {
    console.log("[ BATCH VALIDATION ( PARTIAL FEED ) ]");
    const msgs = singleAuthorMsgs.map((msg) => msg.value);
    const mutMsgs = [...msgs];
    // shift first msg into `previous`
    let previous = mutMsgs.shift();
    validate.validateBatch(hmacKey1, mutMsgs, previous, (err, res) => {
      const isEqual =
        JSON.stringify(singleAuthorMsgsKeys.slice(1, 10)) ===
        JSON.stringify(res);
      if (!err && isEqual) done();
      else done("failed");
    });
  });

  it("batch validation of partial feed (previous seq > 1)", function (done) {
    const msgs = singleAuthorMsgs.map((msg) => msg.value);
    const mutMsgs = [...msgs];
    // skip first msg in the array
    let first = mutMsgs.shift();
    // shift first msg into `previous`
    let previous = mutMsgs.shift();
    validate.validateBatch(hmacKey1, mutMsgs, previous, (err, res) => {
      const isEqual =
        JSON.stringify(singleAuthorMsgsKeys.slice(2, 10)) ===
        JSON.stringify(res);
      if (!err && isEqual) done();
      else done("failed");
    });
  });

  it("batch validation of partial feed without `previous`", function (done) {
    const msgs = singleAuthorMsgs.map((msg) => msg.value);
    const mutMsgs = [...msgs];
    // shift first msg into `previous`
    let previous = mutMsgs.shift();
    // attempt validation of all messages without `previous`
    validate.validateBatch(hmacKey1, mutMsgs, null, (err, res) => {
      if (err.includes("The first message of a feed must have seq of 1"))
        done();
      else done("failed");
    });
  });

  it("batch validation of out-of-order messages", function (done) {
    const msgs = singleAuthorMsgs.map((msg) => msg.value);
    const oooMsgs = [...msgs];
    // shuffle the messages (generate out-of-order state)
    oooMsgs.sort(() => Math.random() - 0.5);
    validate.validateOOOBatch(hmacKey1, oooMsgs, (err, res) => {
      if (!err) done();
      else done("failed");
    });
  });

  it("batch validation of out-of-order multi-author messages", function (done) {
    const msgs = multiAuthorMsgs.map((msg) => msg.value);
    // shuffle the messages (generate out-of-order state)
    const mutMsgs = [...msgs].sort(() => Math.random() - 0.5);
    // use `toBeFalsy` to test for `null` return value (indicates success)
    validate.validateMultiAuthorBatch(hmacKey1, mutMsgs, (err, res) => {
      if (!err) done();
      else done("failed");
    });
  });
});
