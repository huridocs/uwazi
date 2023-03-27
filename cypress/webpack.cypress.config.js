module.exports = {
  mode: 'development',
  devtool: false,
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    fallback: { crypto: require.resolve('crypto-browserify') },
  },
  module: {
    rules: [
      {
        test: /\.ts$|tsx|.d.ts/,
        exclude: [/node_modules/],
        use: [
          {
            loader: 'ts-loader',
            options: {
              // skip typechecking for speed
              transpileOnly: true,
            },
          },
        ],
      },
    ],
  },
};
