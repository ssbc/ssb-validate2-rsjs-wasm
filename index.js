const Comlink = require("comlink");
const promisesToCallbacks = require('./promise-to-cb');

const wrapped = Comlink.wrap(
  new Worker(new URL("./worker.js", import.meta.url), { type: "module" }),
);

const validate = promisesToCallbacks(wrapped)

module.exports = validate;
