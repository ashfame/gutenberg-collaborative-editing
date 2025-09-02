const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  ...defaultConfig,
  resolve: {
    ...defaultConfig.resolve,
    plugins: [
      ...(defaultConfig.resolve.plugins || []),
      new TsconfigPathsPlugin(),
    ],
  },
};
