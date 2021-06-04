import * as Comlink from "../comlink.mjs";
import jsonMsgs from "./multiAuthorMsgs.js";

// map the msg value for each msg in the json array
let msgs = jsonMsgs.map((m) => m.value);

// test suite for multi-author verification and validation
describe("test: ", function () {
  // define validate here so we can access it in all `it` functions
  var validate;

  beforeAll(async function () {
    // load webworker module
    const worker = new Worker(new URL("../worker.js", import.meta.url), {
      type: "module",
    });
    // load Validator class from worker module
    const Validator = Comlink.wrap(worker);
    // instantiate Validator
    validate = await new Validator();
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
