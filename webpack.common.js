const path = require('path');
const webpack = require('webpack');

/*
 * SplitChunksPlugin is enabled by default and replaced
 * deprecated CommonsChunkPlugin. It automatically identifies modules which
 * should be splitted of chunk by heuristics using module duplication count and
 * module category (i. e. node_modules). And splits the chunks…
 *
 * It is safe to remove "splitChunks" from the generated configuration
 * and was added as an educational example.
 *
 * https://webpack.js.org/plugins/split-chunks-plugin/
 *
 */

/*
 * We've enabled MiniCssExtractPlugin for you. This allows your app to
 * use css modules that will be moved into a separate CSS file instead of inside
 * one of your module entries!
 *
 * https://github.com/webpack-contrib/mini-css-extract-plugin
 *
 */

const MiniCssExtractPlugin = require('mini-css-extract-plugin');

/*
 * We've enabled TerserPlugin for you! This minifies your app
 * in order to load faster and run less javascript.
 *
 * https://github.com/webpack-contrib/terser-webpack-plugin
 *
 */

const TerserPlugin = require('terser-webpack-plugin');

const workboxPlugin = require('workbox-webpack-plugin');

const CopyPlugin = require('copy-webpack-plugin');
const FixStyleOnlyEntriesPlugin = require('webpack-fix-style-only-entries');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    content: path.resolve(__dirname, 'src', 'js', 'content.ts'),
    background: path.resolve(__dirname, 'src', 'js', 'background.ts'),
    main: path.resolve(__dirname, 'src', 'css', 'main.css')
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new MiniCssExtractPlugin(),
    new FixStyleOnlyEntriesPlugin(),
    new workboxPlugin.GenerateSW({
      swDest: 'sw.js',
      clientsClaim: true,
      skipWaiting: false
    }),
    new CopyPlugin([{ from: './public', to: './' }]),
    new HtmlWebpackPlugin({
      inject: false,
      filename: 'all_delete_dialog.html',
      template: path.resolve(__dirname, 'src', 'html', 'all_delete_dialog.html')
    })
  ],

  module: {
    rules: [
      {
        test: /.(ts|tsx)$/,
        loader: 'ts-loader',
        include: [path.resolve(__dirname, './src')],
        exclude: [/node_modules/]
      },
      {
        test: /.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
        include: [path.resolve(__dirname, './src')]
      },
      {
        test: /.html$/,
        loader: 'html-loader'
      }
    ]
  },

  resolve: {
    extensions: ['.ts', '.js']
  },

  optimization: {
    minimizer: [new TerserPlugin(), new OptimizeCSSAssetsPlugin()],

    splitChunks: {
      cacheGroups: {
        vendors: {
          priority: -10,
          test: /[\\/]node_modules[\\/]/
        }
      },

      chunks: 'async',
      minChunks: 1,
      minSize: 30000,
      name: true
    }
  }
};
