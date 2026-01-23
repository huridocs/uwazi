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
  let stylesName = 'CSS/[name].css';
  let rtlStylesName = 'CSS/rtl-[name].css';
  let jsChunkHashName = '';
  let outputPath = path.join(rootPath, 'dist');

  if (production) {
    outputPath = path.join(rootPath, 'prod/dist');
    stylesName = 'CSS/[name].[chunkhash].css';
    rtlStylesName = 'CSS/rtl-[name].[fullhash].css';
    jsChunkHashName = '.[chunkhash]';
  }

  return {
    context: rootPath,
    devtool: 'eval-source-map',
    mode: 'development',
    cache: {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
        tsconfig: [path.resolve(rootPath, 'tsconfig.json')],
        babel: [path.resolve(rootPath, 'babel.config.json')],
        postcss: [path.resolve(rootPath, 'postcss.config.js')],
      },
    },
    entry: {
      main: path.join(rootPath, 'app/react/entry-client-bootstrap'),
      nprogress: path.join(rootPath, 'node_modules/nprogress/nprogress.js'),
    },
    output: {
      path: outputPath,
      publicPath: '/',
      filename: `[name]${jsChunkHashName}.js`,
      chunkFilename: `[name]${jsChunkHashName}.bundle.js`,
    },
    resolve: {
      extensions: ['.*', '.webpack.js', '.web.js', '.js', '.jsx', '.tsx', '.ts'],
      alias: {
        'api': path.join(rootPath, 'app/api'),
        'app': path.join(rootPath, 'app/react'),
        'shared': path.join(rootPath, 'app/shared'),
        'UI': path.join(rootPath, 'app/react/UI'),
        'V2': path.join(rootPath, 'app/react/V2'),
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
          vendorStyles: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/].*\.(css|scss|sass)$/,
            chunks: 'all',
            enforce: true,
          },
        },
      },
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
            path.resolve(__dirname, '../node_modules/monaco-editor/min/vs'),
            path.resolve(__dirname, '../node_modules/flowbite/dist'),
            /flowbite\.min\.css$/,
          ],
          use: [
            MiniCssExtractPlugin.loader,
            { loader: 'css-loader', options: { url: false, sourceMap: true } },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  config: path.resolve(__dirname, '../postcss.config.js'),
                },
              },
            },
          ],
        },
        {
          test: /\.s?[ac]ss$/,
          exclude: [
            path.resolve(__dirname, '../node_modules/monaco-editor/min/vs'),
            path.resolve(__dirname, '../node_modules/flowbite/dist'),
            /\.css$/,
          ],
          use: [
            MiniCssExtractPlugin.loader,
            { loader: 'css-loader', options: { url: false, sourceMap: true } },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  config: path.resolve(__dirname, '../postcss.config.js'),
                },
              },
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true,
                sassOptions: {
                  includePaths: [path.join(rootPath, 'app/react/App/scss')],
                },
              },
            },
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
        chunkFilename: stylesName.replace('[name]', '[id]'),
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
          {
            from: 'node_modules/monaco-editor/min/vs/base/browser/ui/codicons/codicon/codicon.ttf',
            to: 'codicon.ttf',
          },
          { from: 'node_modules/flag-icons/flags/4x3/', to: 'flags/4x3/' },
          { from: 'node_modules/flag-icons/flags/1x1/', to: 'flags/1x1/' },
          { from: 'node_modules/pdfjs-dist/cmaps/', to: 'legacy_character_maps' },
          { from: 'node_modules/leaflet/dist/images/', to: 'CSS/images' },
          { from: 'node_modules/leaflet/dist/images/', to: 'images' },
        ],
      }),
      new MonacoWebpackPlugin({
        languages: ['typescript', 'html', 'css'],
      }),
      new BundleAnalyzerPlugin({ analyzerMode }),
      new webpack.HotModuleReplacementPlugin(),
      // Custom plugin to handle # prefixed imports and relative .js/.jsx imports
      new (class {
        apply(compiler) {
          compiler.hooks.normalModuleFactory.tap('HashPrefixPlugin', (nmf) => {
            nmf.hooks.beforeResolve.tap('HashPrefixPlugin', (resolveData) => {
              if (!resolveData.request) return;
              
              const fs = require('fs');
              const request = resolveData.request;
              let newRequest = request;
              
              if (request.startsWith('#')) {
                if (request.startsWith('#app/')) {
                  newRequest = request.replace('#app/', path.join(rootPath, 'app/react/'));
                } else if (request.startsWith('#api/')) {
                  newRequest = request.replace('#api/', path.join(rootPath, 'app/api/'));
                } else if (request.startsWith('#shared/')) {
                  newRequest = request.replace('#shared/', path.join(rootPath, 'app/shared/'));
                } else if (request.startsWith('#UI/')) {
                  newRequest = request.replace('#UI/', path.join(rootPath, 'app/react/UI/'));
                } else if (request.startsWith('#V2/')) {
                  newRequest = request.replace('#V2/', path.join(rootPath, 'app/react/V2/'));
                }
              } else if ((request.startsWith('./') || request.startsWith('../')) && resolveData.context) {
                newRequest = path.resolve(resolveData.context, request);
              } else if (request.startsWith(rootPath) && (request.includes('/app/react/') || request.includes('/app/shared/') || request.includes('/app/api/'))) {
                newRequest = request;
              }
              
              if (newRequest && newRequest !== request || (request.startsWith('./') || request.startsWith('../')) || (request.startsWith(rootPath))) {
                const ext = path.extname(newRequest);
                if (fs.existsSync(newRequest)) {
                  resolveData.request = newRequest;
                } else if (ext === '.js' || ext === '.jsx' || !ext) {
                  const basePath = ext ? newRequest.slice(0, -ext.length) : newRequest;
                  const tsxPath = basePath + '.tsx';
                  const tsPath = basePath + '.ts';
                  const jsxPath = basePath + '.jsx';
                  const jsPath = basePath + '.js';
                  if (fs.existsSync(tsxPath)) {
                    resolveData.request = tsxPath;
                  } else if (fs.existsSync(tsPath)) {
                    resolveData.request = tsPath;
                  } else if (fs.existsSync(jsxPath)) {
                    resolveData.request = jsxPath;
                  } else if (fs.existsSync(jsPath)) {
                    resolveData.request = jsPath;
                  } else {
                    const indexTsx = path.join(basePath, 'index.tsx');
                    const indexTs = path.join(basePath, 'index.ts');
                    const indexJsx = path.join(basePath, 'index.jsx');
                    const indexJs = path.join(basePath, 'index.js');
                    if (fs.existsSync(indexTsx)) {
                      resolveData.request = indexTsx;
                    } else if (fs.existsSync(indexTs)) {
                      resolveData.request = indexTs;
                    } else if (fs.existsSync(indexJsx)) {
                      resolveData.request = indexJsx;
                    } else if (fs.existsSync(indexJs)) {
                      resolveData.request = indexJs;
                    } else {
                      resolveData.request = newRequest;
                    }
                  }
                } else {
                  resolveData.request = newRequest;
                }
              }
            });
          });
        }
      })(),
    ],
  };
};
