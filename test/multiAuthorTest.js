import { ready, validateMultiAuthorBatch } from "../index.js";
import jsonMsgs from "./multiAuthorMsgs.js";

// map the msg value for each msg in the json array
const msgs = jsonMsgs.map((m) => m.value);

describe("test suite for multi-author verification and validation", function () {
  // initialize wasm and webworkers
  beforeAll(async function () {
    await ready();
  });

  it("batch validation of out-of-order multi-author messages", function () {
    // shuffle the messages (generate out-of-order state)
    msgs.sort(() => Math.random() - 0.5);
    // use `toBeFalsy` to test for `null` return value (indicates success)
    expect(validateMultiAuthorBatch(msgs)).toBeFalsy();
  });
});
