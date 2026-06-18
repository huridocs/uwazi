const path = require('path');
const webpack = require('webpack');
const AssetsPlugin = require('assets-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const RtlCssPlugin = require('rtlcss-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const rootPath = path.join(__dirname, '/../');
const myArgs = process.argv.slice(2);
const analyzerMode = myArgs.indexOf('--analyze') !== -1 ? 'static' : 'disabled';

module.exports = production => {
  let stylesName = '[name].css';
  let rtlStylesName = 'rtl-[name].css';
  let jsChunkHashName = '';
  let outputPath = path.join(rootPath, 'dist');

  if (production) {
    outputPath = path.join(rootPath, 'prod/dist');
    stylesName = '[name].[chunkhash].css';
    rtlStylesName = 'rtl-[name].[fullhash].css';
    jsChunkHashName = '.[chunkhash]';
  }

  return {
    context: rootPath,
    devtool: 'eval-source-map',
    mode: production ? 'production' : 'development',
    cache: {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
        tsconfig: [path.resolve(rootPath, 'tsconfig.json')],
        babel: [path.resolve(rootPath, 'babel.config.json')],
        postcss: [path.resolve(rootPath, 'postcss.config.cjs')],
      },
    },
    entry: {
      main: path.join(rootPath, 'app/react/entry-client'),
      nprogress: path.join(rootPath, 'node_modules/nprogress/nprogress.js'),
    },
    output: {
      path: outputPath,
      publicPath: '/',
      filename: `[name]${jsChunkHashName}.js`,
      chunkFilename: `[name]${jsChunkHashName}.bundle.js`,
    },
    resolve: {
      extensions: ['.*', '.webpack.js', '.web.js', '.tsx', '.ts', '.jsx', '.js'],
      extensionAlias: {
        '.js': ['.tsx', '.ts', '.jsx', '.js'],
        '.jsx': ['.tsx', '.jsx'],
      },
      alias: {
        'shared/atomStore/server.store': path.join(rootPath, 'app/shared/atomStore/client.store'),
        './app/shared/atomStore/server.store': path.join(
          rootPath,
          'app/shared/atomStore/client.store'
        ),
        [path.join(rootPath, 'app/shared/atomStore/server.store')]: path.join(
          rootPath,
          'app/shared/atomStore/client.store'
        ),
        './server.store.js': path.join(rootPath, 'app/shared/atomStore/client.store'),
        api: path.join(rootPath, 'app/api'),
        app: path.join(rootPath, 'app/react'),
        shared: path.join(rootPath, 'app/shared'),
        UI: path.join(rootPath, 'app/react/UI'),
        V2: path.join(rootPath, 'app/react/V2'),
        '#api': path.join(rootPath, 'app/api'),
        '#app': path.join(rootPath, 'app/react'),
        '#shared': path.join(rootPath, 'app/shared'),
        '#UI': path.join(rootPath, 'app/react/UI'),
        '#V2': path.join(rootPath, 'app/react/V2'),
      },
    },
    resolveLoader: {
      modules: ['node_modules'],
      extensions: ['.js', '.json', '.ts'],
      mainFields: ['loader', 'main'],
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          commons: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks(chunk) {
              return chunk.name && !chunk.name.match(/LazyLoad/);
            },
          },
        },
      },
      runtimeChunk: false,
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx|ts|tsx)$/,
          include: path.join(rootPath, 'app'),
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader?cacheDirectory',
              options: {
                sourceMap: process.env.BABEL_ENV === 'debug',
              },
            },
          ],
        },
        {
          test: /\.css$/,
          exclude: [
            path.resolve(__dirname, '../node_modules/flowbite/dist'),
            path.resolve(__dirname, '../node_modules/monaco-editor/'),
            path.resolve(__dirname, '../node_modules/pdfjs-dist/web/pdf_viewer.css'),
            /flowbite\.min\.css$/,
          ],
          use: [
            MiniCssExtractPlugin.loader,
            { loader: 'css-loader', options: { url: false, sourceMap: true } },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  config: path.resolve(__dirname, '../postcss.config.cjs'),
                },
              },
            },
          ],
        },
        {
          // This rule is mandatory for pdfjs-dist. The library has bad css selectors
          // that will leak and affect our styles without this rule.
          test: /pdf_viewer\.css$/,
          include: [path.resolve(__dirname, '../node_modules/pdfjs-dist/web')],
          use: [
            MiniCssExtractPlugin.loader,
            { loader: 'css-loader', options: { url: false, sourceMap: true } },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  config: false,
                  plugins: {
                    'postcss-prefix-selector': {
                      prefix: '.pdfViewer',
                      transform(prefix, selector, prefixedSelector) {
                        if (selector.startsWith('.pdfViewer')) {
                          return selector;
                        }
                        if (selector.startsWith('.hiddenCanvasElement')) {
                          return selector;
                        }
                        if (selector === ':root') {
                          return prefix;
                        }
                        return prefixedSelector;
                      },
                    },
                  },
                },
              },
            },
          ],
        },
        {
          test: /\.css$/,
          include: path.resolve(__dirname, '../node_modules/monaco-editor/'),
          use: [
            MiniCssExtractPlugin.loader,
            { loader: 'css-loader', options: { url: true, sourceMap: true } },
          ],
        },
        {
          test: /\.s?[ac]ss$/,
          exclude: [path.resolve(__dirname, '../node_modules/flowbite/dist'), /\.css$/],
          use: [
            MiniCssExtractPlugin.loader,
            { loader: 'css-loader', options: { url: false, sourceMap: true } },
            { loader: 'sass-loader', options: { sourceMap: true } },
          ],
        },
        {
          test: /\.svg$/,
          loader: 'svg-inline-loader',
        },
        {
          test: /world-countries/,
          loader: path.join(__dirname, '/webpackLoaders/country-loader.js'),
        },
        {
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /flowbite\.min\.css$/,
          include: [path.join(rootPath, 'node_modules/flowbite/dist')],
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: { import: true, url: false, sourceMap: true, esModule: true },
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  config: false,
                  plugins: {
                    'postcss-prefix-selector': {
                      prefix: '.tw-datepicker',
                    },
                  },
                },
              },
            },
          ],
        },
        {
          test: /\.ttf$/,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      process.env.CYPRESS &&
        new webpack.ProvidePlugin({
          process: 'process/browser',
        }),
      new NodePolyfillPlugin({ includeAliases: ['path', 'url', 'util', 'Buffer'] }),
      new CleanWebpackPlugin(),
      new MiniCssExtractPlugin({
        filename: stylesName,
        chunkFilename: '[name]' + (production ? '.[contenthash]' : '') + '.css',
      }),
      new RtlCssPlugin({
        filename: rtlStylesName,
      }),
      new AssetsPlugin({
        path: outputPath,
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'node_modules/react-widgets/lib/fonts', to: 'fonts' },
          { from: 'node_modules/flag-icons/flags/4x3/', to: 'flags/4x3/' },
          { from: 'node_modules/flag-icons/flags/1x1/', to: 'flags/1x1/' },
          { from: 'node_modules/leaflet/dist/images/', to: 'CSS/images' },
          { from: 'node_modules/leaflet/dist/images/', to: 'images' },
          { from: 'node_modules/pdfjs-dist/cmaps/', to: 'legacy_character_maps/' },
          { from: 'node_modules/pdfjs-dist/wasm/', to: 'pdfjs_wasm/' },
        ],
      }),

      new MonacoWebpackPlugin({
        languages: ['typescript', 'html', 'css'],
      }),
      new BundleAnalyzerPlugin({ analyzerMode }),
      new webpack.HotModuleReplacementPlugin(),
    ],
  };
};
