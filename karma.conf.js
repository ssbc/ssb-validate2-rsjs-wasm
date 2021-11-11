// SPDX-FileCopyrightText: 2021 Andrew 'glyph' Reid
//
// SPDX-License-Identifier: Unlicense

// Karma configuration

const path = require("path");
const os = require("os");
// const CopyPlugin = require("copy-webpack-plugin");

const ENTROPY_SIZE = 1000000,
  outputPath = `${path.join(os.tmpdir(), "_karma_webpack_")}${Math.floor(
    Math.random() * ENTROPY_SIZE
  )}`;

module.exports = function (config) {
  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: ".",

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ["mocha", "webpack"],

    // list of files / patterns to load in the browser
    files: [
      { pattern: "test/test.js" },
      {
        pattern: `${outputPath}/**/*`,
        watched: false,
        included: false,
      },
      {
        pattern: `test-dist/**/*`,
        watched: false,
        included: false,
        served: true,
      },
    ],

    proxies: {
      "/test-dist/": "/base/test-dist/",
    },

    // list of files / patterns to exclude
    exclude: [],

    plugins: [
      // load plugin
      "karma-webpack",
      "karma-mocha",
      "karma-chrome-launcher",
      "karma-firefox-launcher",
    ],

    esm: {
      nodeResolve: true,
    },

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      "test/test.js": ["webpack"],
    },

    customHeaders: [
      {
        name: "Cross-Origin-Opener-Policy",
        value: "same-origin",
        match: ".*",
      },
      {
        name: "Cross-Origin-Embedder-Policy",
        value: "require-corp",
        match: ".*",
      },
    ],

    client: {
      clearContext: false,
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ["progress"],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ["Chrome"],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    // Set this to `false` for easier in-browser debugging
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,
    webpack: {
      output: {
        path: outputPath,
      },
      // plugins: [
      //   new CopyPlugin({
      //     patterns: [{ from: "build", to: `${outputPath}/build` }],
      //   }),
      // ],
    },
  });
};
