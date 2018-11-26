const path = require('path');
const serverlessWebpack = require('serverless-webpack');
const webpackNodeExternals = require('webpack-node-externals');

module.exports = {
  entry: serverlessWebpack.lib.entries,
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist'),
    library: '[name]',
    libraryTarget: 'commonjs2',
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: { loader: 'babel-loader' },
      }, {
        test: /\.html$/,
        use: [{ loader: 'file-loader', options: { name: '[path][name].[ext]' } }],
      },
    ],
  },
  externals: [webpackNodeExternals()],
  devtool: 'sourcemap',
};
