const Comlink = require("comlink");
const promisesToCallbacks = require("../promise-to-cb");
const jsonMsgs = require("./data/singleAuthorMsgs.js");

// We can't just require ../index because Karma doesn't bundle `new Worker`
const wrapped = Comlink.wrap(new Worker("../test-dist/main.js"));
const validate = promisesToCallbacks(wrapped);

// map the msg value for each msg in the json array
let msgs = jsonMsgs.map((m) => m.value);

const validMsg = {
  key: "%kmXb3MXtBJaNugcEL/Q7G40DgcAkMNTj3yhmxKHjfCM=.sha256",
  value: {
    previous: "%IIjwbJbV3WBE/SBLnXEv5XM3Pr+PnMkrAJ8F+7TsUVQ=.sha256",
    author: "@U5GvOKP/YUza9k53DSXxT0mk3PIrnyAmessvNfZl5E0=.ed25519",
    sequence: 8,
    timestamp: 1470187438539,
    hash: "sha256",
    content: {
      type: "contact",
      contact: "@ye+QM09iPcDJD6YvQYjoQc7sLF/IFhmNbEqgdzQo3lQ=.ed25519",
      following: true,
      blocking: false,
    },
    signature:
      "PkZ34BRVSmGG51vMXo4GvaoS/2NBc0lzdFoVv4wkI8E8zXv4QYyE5o2mPACKOcrhrLJpymLzqpoE70q78INuBg==.sig.ed25519",
  },
  timestamp: 1571140551543,
};

describe("test: ", function () {
  beforeAll(function (done) {
    // load wasm module and initialize webworkers
    validate.ready(done);
  });

  // `toBeFalsy()` checks for a successful result
  // `toContain(error msg)` checks for an error

  it("batch verification of message signatures", function () {
    validate.verifySignatures(msgs, (err) => {
      expect(err).toBeFalsy();
    })
  });

  it("batch verification of out-of-order message signatures", function () {
    const oooMsgs = [...msgs];
    // shuffle the messages (generate out-of-order state)
    oooMsgs.sort(() => Math.random() - 0.5);
    // attempt verification of all messages
    validate.verifySignatures(oooMsgs, (err) => {
      expect(err).toBeFalsy();
    })
  });

  it("verification of single message signature (valid)", function () {
    //let msg = [validMsg];
    let validMsgClone = JSON.parse(JSON.stringify(validMsg));
    let msgs = [validMsgClone];
    validate.verifySignatures(msgs, (err) => {
      expect(err).toBeFalsy();
    })
  });

  it("verification of single message signature (invalid)", function () {
    let invalidMsg = JSON.parse(JSON.stringify(validMsg));
    // change one of the msg fields to invalidate the signature
    invalidMsg.value.content.following = false;
    let msgs = [invalidMsg];
    validate.verifySignatures(msgs, (err) => {
      expect(err).toContain("Signature was invalid");
    })
  });

  it("validation of first message (`seq` == 1) without `previous`", function () {
    validate.validateSingle(msgs[0], null, (err) => {
      expect(err).toBeFalsy();
    })
  });

  it("validation of a single with `previous`", function () {
    validate.validateSingle(msgs[1], msgs[0], (err) => {
      expect(err).toBeFalsy();
    })
  });

  it("validation of a single message (`seq` > 1) without `previous`", function () {
    validate.validateSingle(msgs[3], null, (err) => {
      expect(err).toContain(
        "The first message of a feed must have seq of 1"
      );
    })
  });

  it("batch validation of full feed", function () {
    validate.validateBatch(msgs, null, (err) => {
      expect(err).toBeFalsy();
    })
  });

  it("batch validation of partial feed (previous seq == 1)", function () {
    const mutMsgs = [...msgs];
    // shift first msg into `previous`
    let previous = mutMsgs.shift();
    validate.validateBatch(mutMsgs, previous, (err) => {
      expect(err).toBeFalsy();
    })
  });

  it("batch validation of partial feed (previous seq > 1)", function () {
    const mutMsgs = [...msgs];
    // skip first msg in the array
    let first = mutMsgs.shift();
    // shift first msg into `previous`
    let previous = mutMsgs.shift();
    validate.validateBatch(mutMsgs, previous, (err) => {
      expect(err).toBeFalsy();
    })
  });

  it("batch validation of partial feed without `previous`", function () {
    const mutMsgs = [...msgs];
    // shift first msg into `previous`
    let previous = mutMsgs.shift();
    // attempt validation of all messages without `previous`
    validate.validateBatch(mutMsgs, null, (err) => {
      expect(err).toContain(
        "The first message of a feed must have seq of 1"
      );
    })
  });

  it("batch validation of out-of-order messages", function () {
    const oooMsgs = [...msgs];
    // shuffle the messages (generate out-of-order state)
    oooMsgs.sort(() => Math.random() - 0.5);
    validate.validateOOOBatch(oooMsgs, (err) => {
      expect(err).toBeFalsy();
    })
  });
});
