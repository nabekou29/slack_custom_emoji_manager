const merge = require('webpack-merge');
const common = require('./webpack.common.js');

const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = env =>
  merge(common, {
    mode: 'production',
    plugins: env.analyze ? [new BundleAnalyzerPlugin()] : []
  });
