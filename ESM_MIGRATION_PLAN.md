# Uwazi CJS to ESM Migration Plan

## Overview

This document outlines the comprehensive plan to migrate Uwazi from CommonJS (CJS) to ECMAScript Modules (ESM). This migration addresses the tech debt issues #6313, #6218, and #6186.

## Previous Attempt Analysis

The previous migration attempt in [PR #6314](https://github.com/huridocs/uwazi/pull/6314) failed due to several critical issues:

1. **Mixed Module System in API Routes**: The `app/api/api.js` file mixed ESM imports with CommonJS `require()` calls
2. **Webpack Configuration Complexity**: Multiple webpack configs with heavy CommonJS dependencies
3. **Dynamic Route Loading**: API routes were loaded dynamically using `require()` which doesn't work in ESM
4. **Build Process Dependencies**: Heavy reliance on Babel transpilation and CommonJS patterns

## Root Causes of Previous Failure

- **API Routes Blocker**: Dynamic route loading with `require()` in ESM context
- **Webpack Plugin Dependencies**: Many plugins not ESM-compatible
- **Circular Dependencies**: Exposed during ESM conversion
- **Testing Failures**: Module resolution and mocking issues

## Revised Migration Strategy

### Phase 1: Critical API Routes Fix (Priority 1)

**Problem**: The `app/api/api.js` file has mixed ESM/CommonJS patterns that block ESM migration.

**Current Code**:
```javascript
// app/api/api.js - BLOCKING PATTERN
import activitylogMiddleware from './activitylog/activitylogMiddleware';
import CSRFMiddleware from './auth/CSRFMiddleware';

export default (app, server) => {
  // ESM imports work fine
  app.use(CSRFMiddleware);
  app.use(languageMiddleware);
  
  // These require() calls break in ESM
  require('./socketio/setupSockets').setupApiSockets(server, app);
  require('./auth2fa/routes').default(app);
  require('./relationships/routes').default(app);
  // ... 30+ more require() calls
};
```

**Solution**:
```javascript
// app/api/api.js - ESM VERSION
import activitylogMiddleware from './activitylog/activitylogMiddleware';
import CSRFMiddleware from './auth/CSRFMiddleware';
import languageMiddleware from './utils/languageMiddleware';

export default async (app, server) => {
  // Common middlewares (already ESM)
  app.use(CSRFMiddleware);
  app.use(languageMiddleware);
  app.use(activitylogMiddleware);

  // Convert all require() to dynamic imports
  const { setupApiSockets } = await import('./socketio/setupSockets');
  setupApiSockets(server, app);

  const auth2faRoutes = await import('./auth2fa/routes');
  auth2faRoutes.default(app);

  const relationshipsRoutes = await import('./relationships/routes');
  relationshipsRoutes.default(app);

  const activitylogRoutes = await import('./activitylog/routes');
  activitylogRoutes.default(app);

  const usersRoutes = await import('./users/routes');
  usersRoutes.default(app);

  const templatesRoutes = await import('./templates/routes');
  templatesRoutes.default(app);

  const searchDeprecatedRoutes = await import('./search/deprecatedRoutes');
  searchDeprecatedRoutes.default(app);

  const searchRoutes = await import('./search/routes');
  searchRoutes.default(app);

  const searchV2Routes = await import('./search.v2/routes');
  searchV2Routes.searchRoutes(app);

  const thesauriRoutes = await import('./thesauri/routes');
  thesauriRoutes.default(app);

  const relationtypesRoutes = await import('./relationtypes/routes');
  relationtypesRoutes.default(app);

  const documentsDeprecatedRoutes = await import('./documents/deprecatedRoutes');
  documentsDeprecatedRoutes.default(app);

  const documentsRoutes = await import('./documents/routes');
  documentsRoutes.documentRoutes(app);

  const contactRoutes = await import('./contact/routes');
  contactRoutes.default(app);

  const entitiesRoutes = await import('./entities/routes');
  entitiesRoutes.default(app);

  const entitiesV2Routes = await import('./entities.v2/routes');
  entitiesV2Routes.entitiesRoutes(app);

  const pagesRoutes = await import('./pages/routes');
  pagesRoutes.default(app);

  const filesJsRoutes = await import('./files/jsRoutes.js');
  filesJsRoutes.default(app);

  const filesRoutes = await import('./files/routes');
  filesRoutes.default(app);

  const filesExportRoutes = await import('./files/exportRoutes');
  filesExportRoutes.default(app);

  const filesOcrRoutes = await import('./files/ocrRoutes');
  filesOcrRoutes.ocrRoutes(app);

  const settingsRoutes = await import('./settings/routes');
  settingsRoutes.default(app);

  const i18nRoutes = await import('./i18n/routes');
  i18nRoutes.default(app);

  const i18nV2Routes = await import('./i18n.v2/routes');
  i18nV2Routes.translationsRoutes(app);

  const syncRoutes = await import('./sync/routes');
  syncRoutes.default(app);

  const tasksRoutes = await import('./tasks/routes');
  tasksRoutes.default(app);

  const usergroupsRoutes = await import('./usergroups/routes');
  usergroupsRoutes.default(app);

  const permissionsRoutes = await import('./permissions/routes');
  permissionsRoutes.permissionRoutes(app);

  const suggestionsRoutes = await import('./suggestions/routes');
  suggestionsRoutes.suggestionsRoutes(app);

  const suggestionsExtractorsRoutes = await import('./suggestions/extractorsRoutes');
  suggestionsExtractorsRoutes.extractorsRoutes(app);

  const preserveRoutes = await import('./preserve/routes');
  preserveRoutes.PreserveRoutes(app);

  const relationshipsV2Routes = await import('./relationships.v2/routes/routes');
  relationshipsV2Routes.default(app);

  const statsRoutes = await import('./stats/routes');
  statsRoutes.default(app);

  const testingErrorsRoutes = await import('./testing_errors/routes');
  testingErrorsRoutes.default(app);
};
```

### Phase 2: Package.json Configuration

**Update package.json**:
```json
{
  "type": "module",
  "engines": {
    "node": ">=20.9.0"
  }
}
```

### Phase 3: Entry Points Conversion

**server.js - ESM Version**:
```javascript
import { access } from 'fs/promises';
import { config } from 'dotenv';

config();

process.env.ROOT_PATH = process.env.ROOT_PATH || process.cwd();

const fileExists = async (filePath) => {
  try {
    await access(filePath);
    return true;
  } catch (err) {
    return false;
  }
};

(async () => {
  if (process.env.NODE_ENV === 'production') {
    const productionBuildExists = await fileExists('./prod/app/server.js');
    if (productionBuildExists) {
      await import('./prod/app/server.js');
    } else {
      try {
        await import('./app/server.js');
      } catch (e) {
        console.error(e);
        console.error(
          '\x1b[31m%s\x1b[0m',
          "\nIf you are in a development environment you are probably trying to run a production uwazi without a production build, \
try 'yarn production-build' first"
        );
      }
    }
  } else {
    const { default: babelRegister } = await import('@babel/register');
    babelRegister({ extensions: ['.js', '.jsx', '.ts', '.tsx'] });
    await import('./app/server.js');
  }
})();
```

**scripts/run.js - ESM Version**:
```javascript
import { config } from 'dotenv';

config();

if (process.env.NODE_ENV !== 'production') {
  const { default: babelRegister } = await import('@babel/register');
  babelRegister({ extensions: ['.js', '.jsx', '.ts', '.tsx'] });
}

const cwd = process.env.USE_CWD ? process.cwd() : undefined;
process.env.ROOT_PATH = process.env.ROOT_PATH || cwd || process.cwd();

const file = process.argv[2];
if (file) {
  await import(file);
}
```

### Phase 4: Webpack Configuration

**Strategy**: Create new ESM webpack configs alongside existing ones.

**webpack/config.mjs**:
```javascript
import path from 'path';
import webpack from 'webpack';
import AssetsPlugin from 'assets-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import RtlCssPlugin from 'rtlcss-webpack-plugin';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootPath = path.join(__dirname, '/../');
const myArgs = process.argv.slice(2);
const analyzerMode = myArgs.indexOf('--analyze') !== -1 ? 'static' : 'disabled';

export default (production) => {
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
    mode: 'development',
    cache: {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
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
      extensions: ['.*', '.webpack.js', '.web.js', '.js', '.tsx', '.ts'],
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
          test: /^(?!main\.css|globals\.css)^((.+)\.s?[ac]ss)$/,
          exclude: [
            path.resolve(__dirname, '../node_modules/monaco-editor/min/vs'),
            path.resolve(__dirname, '../node_modules/flowbite/dist'),
          ],
          use: [
            MiniCssExtractPlugin.loader,
            { loader: 'css-loader', options: { url: false, sourceMap: true } },
            { loader: 'sass-loader', options: { sourceMap: true } },
          ],
        },
        {
          test: /(main\.css|globals\.css)$/,
          use: ['postcss-loader'],
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
    ],
  };
};
```

### Phase 5: Script Migration (Address Issues #6218, #6186)

**Convert scripts/describeDatabase.mjs to scripts/describeDatabase.ts**:
```typescript
import process from 'process';
import mongodb from 'mongodb';

const getClient = async () => {
  const url = process.env.DBHOST ? `mongodb://${process.env.DBHOST}/` : 'mongodb://127.0.0.1/';
  const client = new mongodb.MongoClient(url, { useUnifiedTopology: true });
  await client.connect();
  return client;
};

const paddedPrint = (content: string, length: number) => {
  process.stdout.write(
    `${content}${Array(length - content.length)
      .fill('-')
      .join('')}\n`
  );
};

const describeCollection = async (collectionName: string, db: any) => {
  paddedPrint(collectionName, 60);
  const collection = db.collection(collectionName);
  paddedPrint('indices:', 30);
  const indices = await collection.indexInformation();
  Object.entries(indices).forEach(([name, description]) => {
    process.stdout.write(`${name}: ${JSON.stringify(description)}\n`);
  });
  paddedPrint('validator:', 30);
  const options = await collection.options();
  const validator = options.validator || {};
  process.stdout.write(JSON.stringify(validator, null, 2));
  process.stdout.write('\n');
};

const describeDb = async () => {
  const client = await getClient();
  const db = client.db(process.env.DATABASE_NAME || 'uwazi_development');

  const names = new Set(process.argv.slice(2));
  let collections = (await db.listCollections().toArray()).map(c => c.name).sort();
  if (names.size) collections = collections.filter(c => names.has(c));
  for (let i = 0; i < collections.length; i += 1) {
    await describeCollection(collections[i], db);
  }

  client.close();
};

describeDb();
```

**Convert scripts/checkTranslations.mjs to scripts/checkTranslations.ts**:
```typescript
import parser from '@babel/parser';
import traverse from '@babel/traverse';
import mongodb from 'mongodb';
import { resolve } from 'path';
import { promises } from 'fs';

// ... rest of the implementation (already ESM compatible)
```

**Update package.json scripts**:
```json
{
  "scripts": {
    "check-translations": "node --no-experimental-fetch ./scripts/checkTranslations.ts",
    "describe-database": "node --no-experimental-fetch ./scripts/describeDatabase.ts"
  }
}
```

### Phase 6: TypeScript Configuration

**Update tsconfig.json**:
```json
{
  "ts-node": {
    "require": ["tsconfig-paths/register"]
  },
  "compilerOptions": {
    "useUnknownInCatchVariables": false,
    "allowJs": true,
    "noEmit": true,
    "module": "ES2022",
    "target": "es2022",
    "jsx": "react",
    "moduleResolution": "node",
    "isolatedModules": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "resolveJsonModule": true,
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "api/*": ["./app/api/*"],
      "app/*": ["./app/react/*"],
      "shared/*": ["./app/shared/*"],
      "UI": ["./app/react/UI"],
      "UI/*": ["./app/react/UI/*"],
      "V2/*": ["./app/react/V2/*"]
    },
    "skipLibCheck": true
  },
  "include": ["app", "external_modules", "database", "e2e", "scripts/scripts.v2/*"],
  "exclude": ["fixtures", "dist", "prod", "**/*.cy.tsx"]
}
```

### Phase 7: Babel Configuration

**Update babel.config.json**:
```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "node": "current"
        },
        "modules": false
      }
    ],
    "@babel/preset-react",
    "@babel/preset-typescript"
  ],
  "retainLines": true,
  "env": {
    "production": {
      "plugins": [
        "babel-plugin-transform-react-remove-prop-types",
        "@babel/plugin-transform-react-inline-elements"
      ]
    },
    "debug": {
      "sourceMaps": "inline",
      "retainLines": true
    }
  },
  "plugins": [
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-syntax-dynamic-import",
    "@babel/plugin-proposal-optional-chaining",
    "@babel/plugin-proposal-nullish-coalescing-operator",
    [
      "module-resolver",
      {
        "alias": {
          "api": "./app/api",
          "app": "./app/react",
          "shared": "./app/shared",
          "UI": "./app/react/UI",
          "V2": "./app/react/V2"
        }
      }
    ]
  ]
}
```

## Implementation Timeline

### With AI Assistant Help (Reduced Timeline)

- **Phase 1 (API Routes)**: 1-2 days (vs 3-4 days)
- **Phase 2 (Entry Points)**: 1 day (vs 2-3 days)
- **Phase 3 (Webpack)**: 2-3 days (vs 4-5 days)
- **Phase 4 (Scripts)**: 0.5 days (vs 1-2 days)
- **Phase 5 (Testing)**: 1-2 days (vs 3-4 days)

**Total with AI assistance: 5.5-8.5 days** (vs 13-18 days without)

### Critical Success Factors

1. **Start with API Routes**: This is the main blocker
2. **Test Each Phase**: Don't proceed until current phase works
3. **Use Dynamic Imports**: Don't try to convert everything to static imports
4. **Maintain Backward Compatibility**: Keep CJS versions during transition
5. **Incremental Approach**: Convert one module at a time

## Risk Mitigation

1. **Backup Strategy**: Keep original files as `.cjs` extensions
2. **Feature Flags**: Use environment variables to switch between CJS/ESM
3. **Incremental Testing**: Test each converted module individually
4. **Rollback Plan**: Maintain ability to revert to CommonJS
5. **Documentation**: Document each change for team reference

## Benefits After Migration

1. **Modern Module System**: Full ESM support
2. **Better Tree Shaking**: Improved bundle optimization
3. **Future-Proof**: Compatible with modern Node.js features
4. **Developer Experience**: Consistent module system
5. **Performance**: Better module loading and caching

## Files to Change (Minimal Set)

1. `package.json` - Add `"type": "module"`
2. `server.js` - Convert to ESM with dynamic imports
3. `app/api/api.js` - Convert require() to dynamic imports
4. `scripts/run.js` - Convert to ESM
5. `scripts/describeDatabase.mjs` → `scripts/describeDatabase.ts`
6. `scripts/checkTranslations.mjs` → `scripts/checkTranslations.ts`
7. `webpack/config.js` → `webpack/config.mjs`
8. `tsconfig.json` - Update for ESM
9. `babel.config.json` - Update for ESM

## Testing Strategy

1. **Unit Tests**: Run after each file conversion
2. **Integration Tests**: Test API routes loading
3. **Build Tests**: Test webpack compilation
4. **Runtime Tests**: Test server startup and basic functionality
5. **Script Tests**: Test converted scripts execution

---

*This plan addresses the specific issues that caused PR #6314 to fail and provides a practical, incremental approach to ESM migration.*
