const path = require('path');

module.exports = {
  entry: './worker.js',
  output: {
    publicPath: '',
    filename: 'main.js',
    path: path.resolve(__dirname, 'test-dist'),
  },
  target: 'webworker',
  mode: 'production'
};
