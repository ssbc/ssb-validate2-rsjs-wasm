const Comlink = require("comlink");

const validate = Comlink.wrap(
  new Worker(new URL("./worker.js", import.meta.url), { type: "module" }),
);

module.exports = validate;
