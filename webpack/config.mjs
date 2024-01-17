import path, { join } from 'path';
import webpack from 'webpack';
import AssetsPlugin from 'assets-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import RtlCssPlugin from 'rtlcss-webpack-plugin';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { fileURLToPath } from 'url';
import nodeExternals from 'webpack-node-externals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { loader: _loader } = MiniCssExtractPlugin;
const rootPath = join(__dirname, '/../');
const myArgs = process.argv.slice(2);
const analyzerMode = myArgs.indexOf('--analyze') !== -1 ? 'static' : 'disabled';
const { ProvidePlugin, HotModuleReplacementPlugin } = webpack;

export default production => {
  let stylesName = '[name].css';
  let rtlStylesName = 'rtl-[name].css';
  let jsChunkHashName = '';
  let outputPath = join(rootPath, 'dist');

  if (production) {
    outputPath = join(rootPath, 'prod/dist');
    stylesName = '[name].[chunkhash].css';
    rtlStylesName = 'rtl-[name].[fullhash].css';
    jsChunkHashName = '.[chunkhash]';
  }

  return {
    context: rootPath,
    devtool: 'inline-source-map',
    mode: 'development',
    entry: {
      main: join(rootPath, 'app/react/entry-client.tsx'),
      nprogress: join(rootPath, 'node_modules/nprogress/nprogress.js'),
    },
    output: {
      path: outputPath,
      publicPath: '/',
      filename: `[name]${jsChunkHashName}.js`,
      chunkFilename: `[name]${jsChunkHashName}.bundle.js`,
    },
    target: 'node',
    externalsPresets: { node: true },
    externals: [nodeExternals()],
    resolve: {
      alias: {
        'api/*': path.resolve(rootPath, './app/api'),
      },
      extensions: ['', '.webpack.js', '.web.js', '.js', '.ts', '.tsx', '.jsx', '.mjs', '.cjs'],
      extensionAlias: {
        '.js': ['.ts', '.tsx', '.jsx', '.js'],
        '.mjs': ['.mts', '.mjs'],
        '.cjs': ['.cts', '.cjs'],
      },
      fallback: {
        fs: false,
        tls: false,
        net: false,
        path: false,
        zlib: false,
        http: false,
        https: false,
        stream: false,
        crypto: false,
        os: false,
        timers: false,
      },
    },
    resolveLoader: {
      modules: ['node_modules'],
      // extensions: ['', '.js', '.json', '.ts'],
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
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx|js|jsx|mjs)$/,
          include: [join(rootPath, 'app'), join(rootPath, 'database')],
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader?cacheDirectory',
              options: {
                sourceMap: process.env.BABEL_ENV === 'debug',
              },
            },
          ],
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /^(?!main\.css|globals\.css)^((.+)\.s?[ac]ss)$/,
          use: [
            _loader,
            { loader: 'css-loader', options: { url: false, sourceMap: true } },
            { loader: 'sass-loader', options: { sourceMap: true } },
          ],
        },
        {
          test: /(main\.css)$/,
          use: ['postcss-loader'],
        },
        {
          test: /.mdx?$/,
          use: ['babel-loader', '@mdx-js/loader'],
        },
        {
          test: /\.svg$/,
          loader: 'svg-inline-loader',
        },
        // {
        //   test: /world-countries/,
        //   loader: join(__dirname, '/webpackLoaders/country-loader.js'),
        // },
      ],
    },
    plugins: [
      new ProvidePlugin({
        process: 'process/browser',
      }),
      new NodePolyfillPlugin({ includeAliases: ['path', 'url', 'util', 'Buffer'] }),
      new CleanWebpackPlugin(),
      new MiniCssExtractPlugin({
        filename: stylesName,
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
          { from: 'node_modules/flag-icon-css/flags/4x3/', to: 'flags/4x3/' },
          { from: 'node_modules/pdfjs-dist/cmaps/', to: 'legacy_character_maps' },
          { from: 'node_modules/leaflet/dist/images/', to: 'CSS/images' },
          { from: 'node_modules/leaflet/dist/images/', to: 'images' },
        ],
      }),
      new BundleAnalyzerPlugin({ analyzerMode }),
      new HotModuleReplacementPlugin(),
    ],
  };
};
