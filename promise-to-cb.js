// Convert from Promise-based API to callback
module.exports = function promisesToCallbacks(api) {
  return {
    ready(cb) {
      api.ready().then(cb);
    },
    verifySignatures(msgs, cb) {
      api.verifySignatures(msgs).then(cb);
    },
    validateSingle(msg, previous, cb) {
      if (previous) {
        api.validateSingle(msg, previous).then(cb);
      } else {
        api.validateSingle(msg).then(cb);
      }
    },
    validateBatch(msgs, previous, cb) {
      if (previous) {
        api.validateBatch(msgs, previous).then(cb);
      } else {
        api.validateBatch(msgs).then(cb);
      }
    },
    validateOOOBatch(msgs, cb) {
      api.validateOOOBatch(msgs).then(cb);
    },
    validateMultiAuthorBatch(msgs, cb) {
      api.validateMultiAuthorBatch(msgs).then(cb);
    },
  };
};
