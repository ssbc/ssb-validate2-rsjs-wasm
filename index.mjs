import * as Comlink from "comlink";

const wrapped = Comlink.wrap(
  new Worker(new URL("./worker.js", import.meta.url), { type: "module" }),
);

export function ready(cb) {
  wrapped.ready().then(cb);
}

export function verifySignatures(msgs, cb) {
  wrapped.verifySignatures(msgs).then(cb);
}

export function validateSingle(msg, previous, cb) {
  if (previous) {
    wrapped.validateSingle(msg, previous).then(cb);
  } else {
    wrapped.validateSingle(msg).then(cb);
  }
}

export function validateBatch(msgs, previous, cb) {
  if (previous) {
    wrapped.validateBatch(msgs, previous).then(cb);
  } else {
    wrapped.validateBatch(msgs).then(cb);
  }
}

export function validateOOOBatch(msgs, cb) {
  wrapped.validateOOOBatch(msgs).then(cb);
}

export function validateMultiAuthorBatch(msgs, cb) {
  wrapped.validateMultiAuthorBatch(msgs).then(cb);
}
