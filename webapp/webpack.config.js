var webpack = require('webpack')
var path = require('path')

var config = {
  devtool: 'source-map',
  entry: [
    './src/main.js'
  ],
  output: {
    path: path.join(__dirname, './static'),
    filename: '/[name].js',
    publicPath: '/static'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loaders: ['react-hot', 'babel'],
      }
    ]
  }
}

module.exports = config
