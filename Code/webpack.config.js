const path = require('path');

module.exports = {
  entry: {
    obliviousRouting: './src/js/obliviousRouting.js',
    test: './server/static/js/test.src.js',
    // mapTest: './server/static/js/mapTest.src.js'
  },
  output: {
    path: path.resolve(__dirname, 'server/static/js'),
    filename: '[name].js'
  }
};
