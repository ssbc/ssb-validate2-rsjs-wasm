const Comlink = require("comlink");
const jsonMsgs = require("./data/singleAuthorMsgs.js");

// We can't just require ../index because Karma doesn't bundle `new Worker`
const validate = Comlink.wrap(new Worker("../test-dist/main.js"));

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
  beforeAll(async function () {
    // load wasm module and initialize webworkers
    await validate.ready();
  });

  // `toBeFalsy()` checks for a successful result
  // `toContain(error msg)` checks for an error

  it("batch verification of message signatures", async function () {
    // note the `await` before validate (method returns a promise)
    expect(await validate.verifySignatures(msgs)).toEqual();
  });

  it("batch verification of out-of-order message signatures", async function () {
    const oooMsgs = [...msgs];
    // shuffle the messages (generate out-of-order state)
    oooMsgs.sort(() => Math.random() - 0.5);
    // attempt verification of all messages
    expect(await validate.verifySignatures(oooMsgs)).toBeFalsy();
  });

  it("verification of single message signature (valid)", async function () {
    //let msg = [validMsg];
    let validMsgClone = JSON.parse(JSON.stringify(validMsg));
    let msg = [validMsgClone];
    expect(await validate.verifySignatures(msg)).toBeFalsy();
  });

  it("verification of single message signature (invalid)", async function () {
    let invalidMsg = JSON.parse(JSON.stringify(validMsg));
    // change one of the msg fields to invalidate the signature
    invalidMsg.value.content.following = false;
    let msg = [invalidMsg];
    expect(await validate.verifySignatures(msg)).toContain(
      "Signature was invalid"
    );
  });

  it("validation of first message (`seq` == 1) without `previous`", async function () {
    expect(await validate.validateSingle(msgs[0])).toBeFalsy();
  });

  it("validation of a single with `previous`", async function () {
    expect(await validate.validateSingle(msgs[1], msgs[0])).toBeFalsy();
  });

  it("validation of a single message (`seq` > 1) without `previous`", async function () {
    expect(await validate.validateSingle(msgs[3])).toContain(
      "The first message of a feed must have seq of 1"
    );
  });

  it("batch validation of full feed", async function () {
    expect(await validate.validateBatch(msgs)).toBeFalsy();
  });

  it("batch validation of partial feed (previous seq == 1)", async function () {
    const mutMsgs = [...msgs];
    // shift first msg into `previous`
    let previous = mutMsgs.shift();
    expect(await validate.validateBatch(mutMsgs, previous)).toBeFalsy();
  });

  it("batch validation of partial feed (previous seq > 1)", async function () {
    const mutMsgs = [...msgs];
    // skip first msg in the array
    let first = mutMsgs.shift();
    // shift first msg into `previous`
    let previous = mutMsgs.shift();
    expect(await validate.validateBatch(mutMsgs, previous)).toBeFalsy();
  });

  it("batch validation of partial feed without `previous`", async function () {
    const mutMsgs = [...msgs];
    // shift first msg into `previous`
    let previous = mutMsgs.shift();
    // attempt validation of all messages without `previous`
    expect(await validate.validateBatch(mutMsgs)).toContain(
      "The first message of a feed must have seq of 1"
    );
  });

  it("batch validation of out-of-order messages", async function () {
    const oooMsgs = [...msgs];
    // shuffle the messages (generate out-of-order state)
    oooMsgs.sort(() => Math.random() - 0.5);
    expect(await validate.validateOOOBatch(oooMsgs)).toBeFalsy();
  });
});
