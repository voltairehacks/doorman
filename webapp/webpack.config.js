var webpack = require('webpack')
var path = require('path')

var config = {
  devtool: 'inline-source-map',
  entry: [
    './src/index.js'
  ],
  output: {
    path: path.join(__dirname, '../server/dist'),
    filename: '/[name].js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react', 'stage-0']
        }
      }
    ]
  }
}

module.exports = config
