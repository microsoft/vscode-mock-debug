const path = require('path');

module.exports = {
  target: 'node',
  mode: 'production',
  entry: './src/debugAdapter.ts', // Entry point for your TypeScript code
  output: {
    filename: 'debugAdapter.js', // Output bundle filename
    path: path.resolve(__dirname, 'dist'), // Output directory
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
};
