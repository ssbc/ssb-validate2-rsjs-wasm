# ssb-validate2-rsjs-wasm

Cryptographic validation of Scuttlebutt messages using WebAssembly.

Perform batch verification and validation of SSB message values using [ssb-verify-signatures](https://crates.io/crates/ssb-verify-signatures) and [ssb-validate](https://github.com/mycognosist/ssb-validate) from the [Sunrise Choir](https://github.com/sunrise-choir) in the browser.

The [wasm-bindgen](https://crates.io/crates/wasm-bindgen) and [wasm-bindgen-rayon](https://crates.io/crates/wasm-bindgen-rayon) crates are currently used to generate WASM from Rust code.

## Usage

```
npm install ssb-validate2-rsjs-wasm
```

Assuming you are using a bundler that supports understanding `new Worker()` such as [Parcel](https://github.com/parcel-bundler/parcel), you import this library like this (ES Modules):

```js
import * as validate from "ssb-validate2-rsjs-wasm";
```

Or like this (CommonJS):

```js
const validate = require('ssb-validate2-rsjs-wasm');
```

And then all its APIs are callback-based, but you *must* call `ready()` first, just once. Note that the messages are expected to be message `value` objects (*not* `KVT` objects). An array of keys is returned on success:

```js
const hmacKey = null;

validate.ready(() => {
  validate.verifySignatures(hmacKey, [msg1, msg2], (err, res) => {
    if (err) console.log(err);
    // print the keys array (includes keys for msg1 and msg2, in order)
    else console.log(res);
  });
});
```

## Build

Rust first needs to be installed in order to compile to WASM ([installation instructions](https://rustup.rs/)). Also ensure that `clang` version 10 or higher is installed (system dependency).

```bash
git clone git@github.com:ssb-ngi-pointer/ssb-validate2-rsjs-wasm.git
cd ssb-validate2-rsjs-wasm
# install wasm-pack tool
cargo install wasm-pack
# add wasm target for rust compiler
rustup target add wasm32-unknown-unknown
# generate release build of ssb-validate2-rsjs-wasm
npm run build
# run the tests
npm run test
```

The build process creates JavaScript and WASM artifacts in `./pkgs/`. This includes automatically-generated JavaScript code to initialize and handle web workers when running the WASM module in the browser (required for threading support).

If you wish to rebuild the WASM module after making changes to the code, use the `wasm-pack` tool:

`wasm-pack build --target web`

The tool can also compile for alternative target environments. See the [deployment guide](https://rustwasm.github.io/docs/wasm-bindgen/reference/deployment.html) for more information.

The build process also includes bundling with [webpack](https://webpack.js.org). Webpack outputs the bundled assets to `./dist/`. One advantage of the bundled approach is that the resulting code runs in Firefox without the need to include a Module Workers polyfill.

## Tests

Tests for single-author and multi-author messages are included. These tests are defined using [jasmine](https://jasmine.github.io/index.html) and are executed with [karma](http://karma-runner.github.io/6.3/index.html). The tests and related artifacts, such as JSON messages, can be found in the `test` directory. Test configuration for `karma` can be found in `karma.conf.js` in the root of this repo.

As stated in the `Build` section above, the tests can be run with `npm run test`. Note that these tests currently only run in Chrome / Chromium. If you are using Chromium, you may have to export the path as an environment variable before running the tests:

`export CHROME_BIN=/usr/bin/chromium`

If you wish to debug the tests it is recommended to set `singleRun: false,` in the `karma.conf.js` configuration file. This will leave the browser open after the tests have run. Click the `debug` button in the browser, open the developer tools and look at the console log for detailed output.

## Structure

WebAssembly modules must be loaded and run off the main thread (aka the 'UI thread'). We utilise the [Comlink](https://github.com/GoogleChromeLabs/comlink) library to create and manage WebWorkers to achieve the required separation. `worker.js` imports the WASM initialisation and wrapper methods from `index.js`, as well as the `comlink.mjs` module, and defines a `Validator` class. The class is exported for use in the calling module (see `example/main.js` or `test/test.js` for usage). Comlink exposes an `async`, RPC-like interface for our underlying WASM methods.

## Releasing New Versions

To release a new version:

1. Run `npm run build`
1. **Delete** `pkg/package.json` generated from the step above
1. Update the version number in `package.json`
1. Commit with a message that starts with the word "release", e.g. `release 1.1.0`
1. Run `npm publish`

## Useful Documentation

The [wasm-bindgen book](https://rustwasm.github.io/docs/wasm-bindgen/introduction.html) provides detailed information about WebAssembly in the context of Rust.

## License

AGPL 3.0.
