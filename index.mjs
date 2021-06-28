import * as Comlink from "comlink";

const wrapped = Comlink.wrap(
  new Worker(new URL("./worker.js", import.meta.url), { type: "module" }),
);

export function ready(cb) {
  wrapped.ready().then(cb);
}

export function verifySignatures(hmacKey, msgs, cb) {
  wrapped.verifySignatures(hmacKey, msgs).then(([err, res]) => cb(err, res));
}

export function validateSingle(hmacKey, msg, previous, cb) {
  if (previous) {
    wrapped.validateSingle(hmacKey, msg, previous).then(([err, res]) => cb(err, res));
  } else {
    wrapped.validateSingle(hmacKey, msg).then(([err, res]) => cb(err, res));
  }
}

export function validateBatch(hmacKey, msgs, previous, cb) {
  if (previous) {
    wrapped.validateBatch(hmacKey, msgs, previous).then(([err, res]) => cb(err, res));
  } else {
    wrapped.validateBatch(hmacKey, msgs).then(([err, res]) => cb(err, res));
  }
}

export function validateOOOBatch(hmacKey, msgs, cb) {
  wrapped.validateOOOBatch(hmacKey, msgs).then(([err, res]) => cb(err, res));
}

export function validateMultiAuthorBatch(hmacKey, msgs, cb) {
  wrapped.validateMultiAuthorBatch(hmacKey, msgs).then(([err, res]) => cb(err, res));
}
