module.exports = {
  mode: 'development',
  devtool: false,
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$|tsx|.d.ts/,
        exclude: [/node_modules/],
        use: [
          {
            loader: 'babel-loader?cacheDirectory',
            options: {
              sourceMap: true,
            },
            plugins: ['istanbul'],
          },
        ],
      },
    ],
  },
};
