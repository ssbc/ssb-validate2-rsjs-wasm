import * as Comlink from "comlink";
import singleAuthorMsgs from "./data/singleAuthorMsgs.js";
import multiAuthorMsgs from "./data/multiAuthorMsgs.js";
import validMsg from './data/valid.js';

// We can't just require ../index because Karma doesn't bundle `new Worker`
// In Chrome this may work, but we also want to support Firefox
const wrapped = Comlink.wrap(new Worker(new URL("../test-dist/main.js", import.meta.url)));

const validate = {
  ready(cb) {
    wrapped.ready().then(cb);
  },

  verifySignatures(msgs, cb) {
    wrapped.verifySignatures(msgs).then(cb);
  },

  validateSingle(msg, previous, cb) {
    if (previous) {
      wrapped.validateSingle(msg, previous).then(cb);
    } else {
      wrapped.validateSingle(msg).then(cb);
    }
  },

  validateBatch(msgs, previous, cb) {
    if (previous) {
      wrapped.validateBatch(msgs, previous).then(cb);
    } else {
      wrapped.validateBatch(msgs).then(cb);
    }
  },

  validateOOOBatch(msgs, cb) {
    wrapped.validateOOOBatch(msgs).then(cb);
  },

  validateMultiAuthorBatch(msgs, cb) {
    wrapped.validateMultiAuthorBatch(msgs).then(cb);
  },
}

describe("test: ", function () {
  before(function (done) {
    this.timeout(10e3);
    // load wasm module and initialize webworkers
    validate.ready(done);
  });

  it("batch verification of message signatures", function (done) {
    validate.verifySignatures(singleAuthorMsgs, (err) => {
      if (!err) done();
      else done('failed');
    })
  });

  it("batch verification of out-of-order message signatures", function (done) {
    const oooMsgs = [...singleAuthorMsgs];
    // shuffle the messages (generate out-of-order state)
    oooMsgs.sort(() => Math.random() - 0.5);
    // attempt verification of all messages
    validate.verifySignatures(oooMsgs, (err) => {
      if (!err) done();
      else done('failed');
    })
  });

  it("verification of single message signature (valid)", function (done) {
    //let msg = [validMsg];
    let validMsgClone = JSON.parse(JSON.stringify(validMsg));
    let msgs = [validMsgClone];
    validate.verifySignatures(msgs, (err) => {
      if (!err) done();
      else done('failed');
    })
  });

  it("verification of single message signature (invalid)", function (done) {
    let invalidMsg = JSON.parse(JSON.stringify(validMsg));
    // change one of the msg fields to invalidate the signature
    invalidMsg.value.content.following = false;
    let msgs = [invalidMsg];
    validate.verifySignatures(msgs, (err) => {
      if (err.includes('Signature was invalid')) done();
      else done('failed');
    })
  });

  it("validation of first message (`seq` == 1) without `previous`", function (done) {
    validate.validateSingle(singleAuthorMsgs[0], null, (err) => {
      if (!err) done();
      else done('failed');
    })
  });

  it("validation of a single with `previous`", function (done) {
    validate.validateSingle(singleAuthorMsgs[1], singleAuthorMsgs[0], (err) => {
      if (!err) done();
      else done("failed");
    })
  });

  it("validation of a single message (`seq` > 1) without `previous`", function (done) {
    validate.validateSingle(singleAuthorMsgs[3], null, (err) => {
      if (err.includes("The first message of a feed must have seq of 1")) done();
      else done('failed');
    })
  });

  it("batch validation of full feed", function (done) {
    validate.validateBatch(singleAuthorMsgs, null, (err) => {
      if (!err) done();
      else done("failed");
    })
  });

  it("batch validation of partial feed (previous seq == 1)", function (done) {
    const mutMsgs = [...singleAuthorMsgs];
    // shift first msg into `previous`
    let previous = mutMsgs.shift();
    validate.validateBatch(mutMsgs, previous, (err) => {
      if (!err) done();
      else done("failed");
    })
  });

  it("batch validation of partial feed (previous seq > 1)", function (done) {
    const mutMsgs = [...singleAuthorMsgs];
    // skip first msg in the array
    let first = mutMsgs.shift();
    // shift first msg into `previous`
    let previous = mutMsgs.shift();
    validate.validateBatch(mutMsgs, previous, (err) => {
      if (!err) done();
      else done("failed");
    })
  });

  it("batch validation of partial feed without `previous`", function (done) {
    const mutMsgs = [...singleAuthorMsgs];
    // shift first msg into `previous`
    let previous = mutMsgs.shift();
    // attempt validation of all messages without `previous`
    validate.validateBatch(mutMsgs, null, (err) => {
      if (err.includes("The first message of a feed must have seq of 1")) done();
      else done('failed');
    })
  });

  it("batch validation of out-of-order messages", function (done) {
    const oooMsgs = [...singleAuthorMsgs];
    // shuffle the messages (generate out-of-order state)
    oooMsgs.sort(() => Math.random() - 0.5);
    validate.validateOOOBatch(oooMsgs, (err) => {
      if (!err) done();
      else done("failed");
    })
  });

  it("batch validation of out-of-order multi-author messages", function (done) {
    // shuffle the messages (generate out-of-order state)
    const mutMsgs = [...multiAuthorMsgs].sort(() => Math.random() - 0.5);
    // use `toBeFalsy` to test for `null` return value (indicates success)
    validate.validateMultiAuthorBatch(mutMsgs, (err) => {
      if (!err) done();
      else done("failed");
    })
  });
});
