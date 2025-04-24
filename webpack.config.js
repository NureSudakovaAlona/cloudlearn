const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    'basic-load': './src/test-plans/load-tests/basic-load.ts',
    'form-submission': './src/test-plans/load-tests/form-submission.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs',
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  target: 'web',
  externals: /k6(\/.*)?/,
};