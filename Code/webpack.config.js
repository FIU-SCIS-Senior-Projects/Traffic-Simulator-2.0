const path = require('path');

module.exports = {
  entry: {
    test: './server/static/js/test.src.js'
  },
  output: {
    path: path.resolve(__dirname, 'server/static/js'),
    filename: '[name].js'
  }
}