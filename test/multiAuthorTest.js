const Comlink = require("comlink");
const jsonMsgs = require("./data/multiAuthorMsgs.js");

// We can't just require ../index because Karma doesn't bundle `new Worker`
const validate = Comlink.wrap(new Worker("../dist/main.js"));

// map the msg value for each msg in the json array
let msgs = jsonMsgs.map((m) => m.value);

// test suite for multi-author verification and validation
describe("test: ", function () {
  beforeAll(async function () {
    // load wasm module and initialize webworkers
    await validate.ready();
  });

  it("batch validation of out-of-order multi-author messages", async function () {
    // shuffle the messages (generate out-of-order state)
    msgs.sort(() => Math.random() - 0.5);
    // use `toBeFalsy` to test for `null` return value (indicates success)
    expect(await validate.validateMultiAuthorBatch(msgs)).toBeFalsy();
  });
});
