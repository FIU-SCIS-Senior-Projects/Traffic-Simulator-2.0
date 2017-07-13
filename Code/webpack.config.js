const path = require('path');

module.exports = {
  entry: {
    app: './client/app/app.js'
  },
  output: {
    path: path.resolve(__dirname, 'server/static/js'),
    filename: '[name].js'
  }
};
