const Comlink = require("comlink");
const promisesToCallbacks = require("../promise-to-cb");
const jsonMsgs = require("./data/multiAuthorMsgs.js");

// We can't just require ../index because Karma doesn't bundle `new Worker`
const wrapped = Comlink.wrap(new Worker("../test-dist/main.js"));
const validate = promisesToCallbacks(wrapped);

// map the msg value for each msg in the json array
let msgs = jsonMsgs.map((m) => m.value);

// test suite for multi-author verification and validation
describe("test: ", function () {
  beforeAll(function (done) {
    // load wasm module and initialize webworkers
    validate.ready(done);
  });

  it("batch validation of out-of-order multi-author messages", function () {
    // shuffle the messages (generate out-of-order state)
    msgs.sort(() => Math.random() - 0.5);
    // use `toBeFalsy` to test for `null` return value (indicates success)
    validate.validateMultiAuthorBatch(msgs, (err) => {
      expect(err).toBeFalsy();
    })
  });
});
