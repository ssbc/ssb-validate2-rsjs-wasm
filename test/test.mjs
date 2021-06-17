import * as Comlink from "comlink";
import singleAuthorMsgs from "./data/singleAuthorMsgs.js";
import singleAuthorMsgsKeys from "./data/singleAuthorMsgsKeys.js";
import multiAuthorMsgs from "./data/multiAuthorMsgs.js";
import validMsg from "./data/valid.js";
import validMsgKey from "./data/validKey.js";

// We can't just require ../index because Karma doesn't bundle `new Worker`
// In Chrome this may work, but we also want to support Firefox
const wrapped = Comlink.wrap(
  new Worker(new URL("../test-dist/main.js", import.meta.url))
);

const validate = {
  ready(cb) {
    wrapped.ready().then(cb);
  },

  verifySignatures(msgs, cb) {
    wrapped.verifySignatures(msgs).then(([err, res]) => cb(err, res));
  },

  validateSingle(msg, previous, cb) {
    if (previous) {
      wrapped.validateSingle(msg, previous).then(([err, res]) => cb(err, res));
    } else {
      wrapped.validateSingle(msg).then(([err, res]) => cb(err, res));
    }
  },

  validateBatch(msgs, previous, cb) {
    if (previous) {
      wrapped.validateBatch(msgs, previous).then(([err, res]) => cb(err, res));
    } else {
      wrapped.validateBatch(msgs).then(([err, res]) => cb(err, res));
    }
  },

  validateOOOBatch(msgs, cb) {
    wrapped.validateOOOBatch(msgs).then(([err, res]) => cb(err, res));
  },

  validateMultiAuthorBatch(msgs, cb) {
    wrapped.validateMultiAuthorBatch(msgs).then(([err, res]) => cb(err, res));
  },
};

describe("test: ", function () {
  before(function (done) {
    this.timeout(10e3);
    // load wasm module and initialize webworkers
    validate.ready(done);
  });

  it("batch verification of message signatures", function (done) {
    const msgs = singleAuthorMsgs.map((msg) => msg.value);
    validate.verifySignatures(msgs, (err, res) => {
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
    validate.verifySignatures(oooMsgs, (err, res) => {
      if (!err) done();
      else done("failed");
    });
  });

  it("verification of single message signature (valid)", function (done) {
    let validMsgClone = JSON.parse(JSON.stringify(validMsg));
    let msgs = [validMsgClone.value];
    validate.verifySignatures(msgs, (err, res) => {
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
    validate.verifySignatures(msgs, (err, res) => {
      if (err.includes("Signature was invalid")) done();
      else done("failed");
    });
  });

  it("validation of first message (`seq` == 1) without `previous`", function (done) {
    validate.validateSingle(singleAuthorMsgs[0].value, null, (err, res) => {
      const isEqual =
        JSON.stringify(singleAuthorMsgsKeys[0]) === JSON.stringify(res);
      if (!err && isEqual) done();
      else done("failed");
    });
  });

  it("validation of a single with `previous`", function (done) {
    validate.validateSingle(
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
    validate.validateSingle(singleAuthorMsgs[3].value, null, (err, res) => {
      if (err.includes("The first message of a feed must have seq of 1"))
        done();
      else done("failed");
    });
  });

  it("batch validation of full feed", function (done) {
    const msgs = singleAuthorMsgs.map((msg) => msg.value);
    validate.validateBatch(msgs, null, (err, res) => {
      const isEqual =
        JSON.stringify(singleAuthorMsgsKeys) === JSON.stringify(res);
      if (!err && isEqual) done();
      else done("failed");
    });
  });

  it("batch validation of partial feed (previous seq == 1)", function (done) {
    const msgs = singleAuthorMsgs.map((msg) => msg.value);
    const mutMsgs = [...msgs];
    // shift first msg into `previous`
    let previous = mutMsgs.shift();
    validate.validateBatch(mutMsgs, previous, (err, res) => {
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
    validate.validateBatch(mutMsgs, previous, (err, res) => {
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
    validate.validateBatch(mutMsgs, null, (err, res) => {
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
    validate.validateOOOBatch(oooMsgs, (err, res) => {
      if (!err) done();
      else done("failed");
    });
  });

  it("batch validation of out-of-order multi-author messages", function (done) {
    const msgs = multiAuthorMsgs.map((msg) => msg.value);
    // shuffle the messages (generate out-of-order state)
    const mutMsgs = [...msgs].sort(() => Math.random() - 0.5);
    // use `toBeFalsy` to test for `null` return value (indicates success)
    validate.validateMultiAuthorBatch(mutMsgs, (err, res) => {
      if (!err) done();
      else done("failed");
    });
  });
});
