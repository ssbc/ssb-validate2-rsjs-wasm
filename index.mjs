import * as Comlink from "comlink";

const wrapped = Comlink.wrap(
  new Worker(new URL("./worker.js", import.meta.url), { type: "module" }),
);

export function ready(cb) {
  wrapped.ready().then(cb);
}

export function verifySignatures(msgs, cb) {
  wrapped.verifySignatures(msgs).then(([err, res]) => cb(err, res));
}

export function validateSingle(msg, previous, cb) {
  if (previous) {
    wrapped.validateSingle(msg, previous).then(([err, res]) => cb(err, res));
  } else {
    wrapped.validateSingle(msg).then(([err, res]) => cb(err, res));
  }
}

export function validateBatch(msgs, previous, cb) {
  if (previous) {
    wrapped.validateBatch(msgs, previous).then(([err, res]) => cb(err, res));
  } else {
    wrapped.validateBatch(msgs).then(([err, res]) => cb(err, res));
  }
}

export function validateOOOBatch(msgs, cb) {
  wrapped.validateOOOBatch(msgs).then(([err, res]) => cb(err, res));
}

export function validateMultiAuthorBatch(msgs, cb) {
  wrapped.validateMultiAuthorBatch(msgs).then(([err, res]) => cb(err, res));
}
