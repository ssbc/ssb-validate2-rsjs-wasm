// SPDX-FileCopyrightText: 2021 Andre 'Staltz' Medeiros
//
// SPDX-License-Identifier: Unlicense

const path = require('path');

module.exports = {
  entry: "./main.js",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "bundle"),
  },
  mode: "production",
  target: 'web',
};
