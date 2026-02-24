export default {
  stories: [
    '../app/react/stories/**/*.stories.mdx',
    '../app/react/stories/**/*.stories.@(js|jsx|ts|tsx)',
  ],

  staticDirs: ['../cypress/test_files'],

  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-viewport',
    '@storybook/addon-actions',
    '@storybook/addon-webpack5-compiler-babel',
    '@chromatic-com/storybook',
  ],

  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },

  previewHead: head => `
    ${head}
    <style>
      html {
        font-family: sans-serif;
        font-size: 16px;
      }
    </style>
    <script>
      if (typeof window !== 'undefined' && !window._interopRequireDefault) {
        window._interopRequireDefault = function(e) {
          return e && e.__esModule ? e : { default: e };
        };
      }
    </script>
  `,

  webpackFinal: async config => {
    if (typeof process === 'undefined' || !process.versions?.node) {
      return config;
    }

    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const webpack = await import('webpack');
    const __filename = fileURLToPath(import.meta.url);
    const rootPath = path.dirname(path.dirname(__filename));
    const cssLoaderPath = path.join(rootPath, 'node_modules/css-loader');

    const existingExtensions = config.resolve?.extensions || [];
    const newExtensions = ['.webpack.js', '.web.js', '.js', '.jsx', '.tsx', '.ts'];
    const allExtensions = [...new Set([...existingExtensions, ...newExtensions])];

    const fs = await import('fs');
    const MiniCssExtractPlugin = (await import('mini-css-extract-plugin')).default;

    const cssLoaderFixPlugin = {
      apply: compiler => {
        compiler.hooks.normalModuleFactory.tap('CssLoaderFixPlugin', nmf => {
          nmf.hooks.beforeResolve.tap('CssLoaderFixPlugin', resolveData => {
            if (resolveData.request && resolveData.request.includes('css-loader.mjs')) {
              resolveData.request = cssLoaderPath;
            }
          });
        });
        compiler.hooks.compilation.tap('CssLoaderFixPlugin', compilation => {
          compilation.hooks.normalModuleLoader.tap(
            'CssLoaderFixPlugin',
            (loaderContext, module) => {
              if (module.userRequest && module.userRequest.includes('css-loader.mjs')) {
                module.userRequest = module.userRequest.replace(
                  /\.\/css-loader\.mjs/,
                  cssLoaderPath
                );
              }
            }
          );
        });
      },
    };

    const hashPrefixModuleFactoryPlugin = {
      apply: compiler => {
        compiler.hooks.normalModuleFactory.tap('HashPrefixModuleFactoryPlugin', nmf => {
          nmf.hooks.beforeResolve.tap('HashPrefixModuleFactoryPlugin', resolveData => {
            if (!resolveData.request || typeof resolveData.request !== 'string') {
              return;
            }

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
            } else if (
              (request.startsWith('./') || request.startsWith('../')) &&
              resolveData.context
            ) {
              const contextPath =
                typeof resolveData.context === 'string' ? resolveData.context : '';
              if (contextPath) {
                try {
                  newRequest = path.resolve(contextPath, request);
                  if (newRequest.includes('atomStore') && newRequest.includes('server.store')) {
                    newRequest = path.join(rootPath, 'app/shared/atomStore/client.store.ts');
                  }
                } catch (e) {
                  return;
                }
              }
            } else if (request === 'entities/decode' || request.endsWith('entities/decode')) {
              newRequest = path.join(rootPath, 'node_modules/entities/lib/esm/decode.js');
            } else if (request.includes('entities') && request.includes('/decode')) {
              if (request.endsWith('entities/decode') || request.endsWith('entities/lib/decode')) {
                newRequest = path.join(rootPath, 'node_modules/entities/lib/esm/decode.js');
              }
            }

            if (newRequest !== request && typeof newRequest === 'string') {
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
      },
    };

    const resolveFileExtension = (filePath, contextPath) => {
      if (typeof filePath !== 'string') {
        return filePath;
      }
      if (fs.existsSync(filePath)) {
        return filePath;
      }

      const ext = path.extname(filePath);
      if (ext === '.js' || ext === '.jsx' || !ext) {
        const basePath = ext ? filePath.slice(0, -ext.length) : filePath;
        const tsxPath = basePath + '.tsx';
        const tsPath = basePath + '.ts';
        const jsxPath = basePath + '.jsx';
        const jsPath = basePath + '.js';
        if (fs.existsSync(tsxPath)) {
          return tsxPath;
        } else if (fs.existsSync(tsPath)) {
          return tsPath;
        } else if (fs.existsSync(jsxPath)) {
          return jsxPath;
        } else if (fs.existsSync(jsPath)) {
          return jsPath;
        } else {
          const indexTsx = path.join(basePath, 'index.tsx');
          const indexTs = path.join(basePath, 'index.ts');
          const indexJsx = path.join(basePath, 'index.jsx');
          const indexJs = path.join(basePath, 'index.js');
          if (fs.existsSync(indexTsx)) {
            return indexTsx;
          } else if (fs.existsSync(indexTs)) {
            return indexTs;
          } else if (fs.existsSync(indexJsx)) {
            return indexJsx;
          } else if (fs.existsSync(indexJs)) {
            return indexJs;
          }
        }
      }
      return filePath;
    };

    class HashPrefixResolverPlugin {
      apply(resolver) {
        resolver.hooks.resolve.tapAsync(
          'HashPrefixResolverPlugin',
          (request, resolveContext, callback) => {
            if (!request.request || typeof request.request !== 'string') {
              return callback();
            }

            const originalRequest = request.request;
            let newRequest = originalRequest;
            let shouldProcess = false;

            if (originalRequest.startsWith('#')) {
              shouldProcess = true;
              if (originalRequest.startsWith('#app/')) {
                newRequest = originalRequest.replace('#app/', path.join(rootPath, 'app/react/'));
              } else if (originalRequest.startsWith('#api/')) {
                newRequest = originalRequest.replace('#api/', path.join(rootPath, 'app/api/'));
              } else if (originalRequest.startsWith('#shared/')) {
                newRequest = originalRequest.replace(
                  '#shared/',
                  path.join(rootPath, 'app/shared/')
                );
              } else if (originalRequest.startsWith('#UI/')) {
                newRequest = originalRequest.replace('#UI/', path.join(rootPath, 'app/react/UI/'));
              } else if (originalRequest.startsWith('#V2/')) {
                newRequest = originalRequest.replace('#V2/', path.join(rootPath, 'app/react/V2/'));
              }
            } else if (originalRequest.startsWith('./') || originalRequest.startsWith('../')) {
              const contextPath =
                typeof request.context === 'string'
                  ? request.context
                  : request.context?.issuer || request.context?.context || '';
              if (contextPath && typeof contextPath === 'string') {
                try {
                  const resolvedPath = path.resolve(contextPath, originalRequest);
                  if (typeof resolvedPath === 'string') {
                    shouldProcess = true;
                    newRequest = resolvedPath;
                  }
                } catch (e) {
                  return callback();
                }
              }
            }

            if (shouldProcess && typeof newRequest === 'string') {
              const finalRequest = resolveFileExtension(newRequest, request.context);
              if (
                typeof finalRequest === 'string' &&
                finalRequest !== newRequest &&
                fs.existsSync(finalRequest)
              ) {
                const newRequestObj = {
                  ...request,
                  request: finalRequest,
                };
                resolver.doResolve(
                  resolver.hooks.resolve,
                  newRequestObj,
                  null,
                  resolveContext,
                  callback
                );
                return;
              }
            }

            callback();
          }
        );
      }
    }

    const interopRequireDefaultPath = path.join(
      rootPath,
      'node_modules/@babel/runtime/helpers/interopRequireDefault.js'
    );

    const fixDomHelpersSourcePlugin = {
      apply: compiler => {
        compiler.hooks.normalModuleFactory.tap('FixDomHelpersSourcePlugin', nmf => {
          nmf.hooks.beforeResolve.tap('FixDomHelpersSourcePlugin', resolveData => {
            if (
              resolveData.request &&
              resolveData.request.includes('@babel/runtime/helpers/interopRequireDefault')
            ) {
              resolveData.request = interopRequireDefaultPath;
            }
          });
        });
        compiler.hooks.compilation.tap('FixDomHelpersSourcePlugin', compilation => {
          compilation.hooks.buildModule.tap('FixDomHelpersSourcePlugin', module => {
            if (module.resource && module.resource.includes('dom-helpers/activeElement.js')) {
              const originalSource = module._source;
              if (originalSource && originalSource._value) {
                const sourceCode = originalSource._value.toString();
                if (
                  sourceCode.includes('require("@babel/runtime/helpers/interopRequireDefault")')
                ) {
                  const helperFunction = `function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}`;
                  const fixedSource = sourceCode.replace(
                    /var _interopRequireDefault = require\("@babel\/runtime\/helpers\/interopRequireDefault"\);?/g,
                    helperFunction
                  );
                  module._source._value = fixedSource;
                }
              }
            }
          });
        });
      },
    };

    const excludeHeadlessUIFromVendorChunk = (module, defaultTest) => {
      const id = module.identifier?.() ?? '';
      if (id.includes('@headlessui')) return false;
      if (typeof defaultTest === 'function') return defaultTest(module);
      if (defaultTest instanceof RegExp) return defaultTest.test(id);
      return true;
    };

    const existingCacheGroups = config.optimization?.splitChunks?.cacheGroups ?? {};
    const defaultVendors = existingCacheGroups.defaultVendors ?? { test: /[\\/]node_modules[\\/]/ };
    const defaultVendorsTest = defaultVendors.test;

    return {
      ...config,
      output: {
        ...config.output,
        publicPath: config.output?.publicPath ?? '/',
      },
      optimization: {
        ...config.optimization,
        splitChunks: {
          ...config.optimization?.splitChunks,
          cacheGroups: {
            ...existingCacheGroups,
            defaultVendors: {
              ...defaultVendors,
              test: module => excludeHeadlessUIFromVendorChunk(module, defaultVendorsTest),
            },
          },
        },
      },
      plugins: [
        ...(config.plugins || []),
        new MiniCssExtractPlugin({}),
        cssLoaderFixPlugin,
        hashPrefixModuleFactoryPlugin,
        fixDomHelpersSourcePlugin,
      ],
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
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
          'entities/decode': path.join(rootPath, 'node_modules/entities/lib/esm/decode.js'),
          '@babel/runtime': path.join(rootPath, 'node_modules/@babel/runtime'),
          '@babel/runtime/helpers/interopRequireDefault': path.join(
            rootPath,
            'node_modules/@babel/runtime/helpers/interopRequireDefault.js'
          ),
        },
        fallback: {
          ...config.resolve?.fallback,
        },
        extensions: allExtensions,
        modules: [path.join(rootPath, 'node_modules'), ...(config.resolve?.modules || [])],
        mainFields: ['browser', 'module', 'main'],
        conditionNames: ['import', 'require', 'default'],
        plugins: [...(config.resolve?.plugins || [])],
      },
      module: {
        ...config.module,
        rules: [
          {
            test: /tailwind\.css$/,
            use: [
              MiniCssExtractPlugin.loader,
              { loader: 'css-loader', options: { url: false, sourceMap: true } },
              {
                loader: 'postcss-loader',
                options: {
                  postcssOptions: {
                    config: path.join(rootPath, 'postcss.config.cjs'),
                  },
                },
              },
            ],
          },
          {
            test: /\.s?[ac]ss$/,
            exclude: [
              /node_modules\/monaco-editor\/min\/vs/,
              /node_modules\/flowbite\/dist/,
              /tailwind\.css$/,
              /\.css$/,
            ],
            use: [
              MiniCssExtractPlugin.loader,
              { loader: 'css-loader', options: { url: false, sourceMap: true } },
              {
                loader: 'postcss-loader',
                options: {
                  postcssOptions: {
                    config: path.join(rootPath, 'postcss.config.cjs'),
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
            test: /\.css$/,
            exclude: [/node_modules\/monaco-editor\/min\/vs/, /tailwind\.css$/],
            use: [
              MiniCssExtractPlugin.loader,
              { loader: 'css-loader', options: { url: false, sourceMap: true } },
            ],
          },
          {
            test: /\.svg$/,
            loader: 'svg-inline-loader',
          },
          ...(config.module?.rules || []).filter(rule => {
            if (!rule || !rule.test) return true;
            const testStr = rule.test.toString();
            if (testStr.includes('scss') || testStr.includes('sass')) {
              return false;
            }
            if (testStr.includes('css') && !testStr.includes('tailwind')) {
              return false;
            }
            return true;
          }),
        ],
      },
      resolveLoader: {
        ...config.resolveLoader,
        modules: [path.join(rootPath, 'node_modules'), ...(config.resolveLoader?.modules || [])],
        alias: {
          ...config.resolveLoader?.alias,
          'css-loader': cssLoaderPath,
          './css-loader.mjs': cssLoaderPath,
        },
      },
    };
  },

  docs: {
    autodocs: true,
  },

  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },

  babel: async config => {
    return {
      ...config,
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              browsers: ['> 1%', 'last 2 versions'],
            },
            modules: false,
          },
        ],
        '@babel/preset-react',
        '@babel/preset-typescript',
      ],
      plugins: [
        ...(config.plugins || []).filter(
          plugin =>
            !(Array.isArray(plugin) && plugin[0]?.includes?.('ignore-scss')) &&
            !(typeof plugin === 'string' && plugin.includes('ignore-scss')) &&
            !(typeof plugin === 'function' && plugin.toString().includes('ignore-scss'))
        ),
        '@babel/plugin-proposal-object-rest-spread',
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-syntax-dynamic-import',
        '@babel/plugin-proposal-optional-chaining',
        '@babel/plugin-proposal-nullish-coalescing-operator',
      ],
      sourceType: 'unambiguous',
    };
  },
};
