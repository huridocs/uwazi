const configFactory = require('../webpack/config.cjs');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

const rootPath = path.join(__dirname, '/../');

const HashPrefixPlugin = class {
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
          if (newRequest.includes('atomStore') && newRequest.includes('server.store') && !newRequest.includes('stub')) {
            newRequest = path.join(rootPath, 'app/shared/atomStore/server.store.stub.ts');
          }
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
};

module.exports = function customizeWebpackConfig(config) {
  const custom = configFactory();
  
  config.plugins.push(new MiniCssExtractPlugin({}));
  config.plugins.push(new HashPrefixPlugin());
  const stubPath = path.join(rootPath, 'app/shared/atomStore/server.store.stub.ts');
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(
      /(^\.\/server\.store(\.ts|\.js)?$|[/\\]atomStore[/\\]server\.store(\.ts|\.js)?$)/,
      stubPath
    )
  );
  
  config.externals = config.externals || {};
  if (typeof config.externals === 'object' && !Array.isArray(config.externals)) {
    config.externals = {
      ...config.externals,
      'fs': 'commonjs fs',
      'path': 'commonjs path',
    };
  }
  
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        ...custom.resolve.alias,
        [path.join(rootPath, 'app/shared/atomStore/server.store.ts')]: stubPath,
        [path.join(rootPath, 'app/shared/atomStore/server.store.js')]: stubPath,
      },
      extensions: [...new Set([...(config.resolve?.extensions || []), ...custom.resolve.extensions])],
    },
    module: {
      ...config.module,
      rules: custom.module?.rules || config.module.rules,
    },
  };
};
