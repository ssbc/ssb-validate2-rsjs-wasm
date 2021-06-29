import * as Comlink from "comlink";

const wrapped = Comlink.wrap(
  new Worker(new URL("./worker.js", import.meta.url), { type: "module" })
);

function convertResults(cb) {
  return ([err, res]) => (err ? cb(new Error(err)) : cb(null, res));
}

export function ready(cb) {
  wrapped.ready().then(cb);
}

export function verifySignatures(hmacKey, msgs, cb) {
  wrapped.verifySignatures(hmacKey, msgs).then(convertResults(cb));
}

export function validateSingle(hmacKey, msg, previous, cb) {
  if (previous) {
    wrapped.validateSingle(hmacKey, msg, previous).then(convertResults(cb));
  } else {
    wrapped.validateSingle(hmacKey, msg).then(convertResults(cb));
  }
}

export function validateBatch(hmacKey, msgs, previous, cb) {
  if (previous) {
    wrapped.validateBatch(hmacKey, msgs, previous).then(convertResults(cb));
  } else {
    wrapped.validateBatch(hmacKey, msgs).then(convertResults(cb));
  }
}

export function validateOOOBatch(hmacKey, msgs, cb) {
  wrapped.validateOOOBatch(hmacKey, msgs).then(convertResults(cb));
}

export function validateMultiAuthorBatch(hmacKey, msgs, cb) {
  wrapped.validateMultiAuthorBatch(hmacKey, msgs).then(convertResults(cb));
}
