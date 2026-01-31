/* eslint-disable import/first,global-require,import/no-dynamic-require,no-console */
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const projectRoot = path.resolve(__dirname, '..');

function resolvePath(sourcePath, currentFile, opts) {
  let resolvedPath = sourcePath;

  if (resolvedPath.endsWith('.js')) {
    resolvedPath = resolvedPath.slice(0, -3);
  } else if (resolvedPath.endsWith('.jsx')) {
    resolvedPath = resolvedPath.slice(0, -4);
  }

  if (resolvedPath.startsWith('#api/') || resolvedPath.startsWith('#api')) {
    resolvedPath = resolvedPath.replace(/^#api\/?/, path.join(projectRoot, 'app/api') + '/');
  } else if (resolvedPath.startsWith('#shared/') || resolvedPath.startsWith('#shared')) {
    resolvedPath = resolvedPath.replace(/^#shared\/?/, path.join(projectRoot, 'app/shared') + '/');
  } else if (resolvedPath.startsWith('#app/') || resolvedPath.startsWith('#app')) {
    resolvedPath = resolvedPath.replace(/^#app\/?/, path.join(projectRoot, 'app/react') + '/');
  } else if (resolvedPath.startsWith('#V2/') || resolvedPath.startsWith('#V2')) {
    resolvedPath = resolvedPath.replace(/^#V2\/?/, path.join(projectRoot, 'app/react/V2') + '/');
  } else if (resolvedPath.startsWith('#UI/') || resolvedPath.startsWith('#UI')) {
    resolvedPath = resolvedPath.replace(/^#UI\/?/, path.join(projectRoot, 'app/react/UI') + '/');
  }

  if (!path.isAbsolute(resolvedPath) && (resolvedPath.startsWith('./') || resolvedPath.startsWith('../'))) {
    const currentDir = path.dirname(currentFile);
    resolvedPath = path.resolve(currentDir, resolvedPath);
  }

  const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
  for (const ext of extensions) {
    const fullPath = resolvedPath + ext;
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath;
    }
    const indexPath = path.join(resolvedPath, 'index' + ext);
    if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
      return indexPath;
    }
  }

  return undefined;
}

require('@babel/register')({
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' }, modules: 'cjs' }],
    '@babel/preset-typescript',
  ],
  plugins: [
    [
      'babel-plugin-module-resolver',
      {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        resolvePath,
      },
    ],
  ],
});

const { compile } = require('json-schema-to-typescript');

const rootPath = '..';

const opts = {
  strictIndexSignatures: true,
  enableConstEnums: false,
  declareExternallyReferenced: false,
  bannerComment: '',
  style: {
    singleQuote: true,
  },
};
const banner = '/* eslint-disable */\n/**AUTO-GENERATED. RUN yarn emit-types to update.*/\n';

const customImports = {
  '../app/shared/types/commonSchemas.ts': [
    "import { ObjectId } from 'mongodb';",
    "import { TraverseInputType } from './relationshipsQueryTypes.js'",
  ],
  '../app/api/common.v2/database/schemas/commonSchemas.ts': ["import { ObjectId } from 'mongodb';"],
  '../app/shared/types/connectionSchema.ts': ["import { FileType } from './fileType.js';"],
};

const dryCheck = !!process.argv[2] && process.argv[2] === '--check';

const firstUp = name => name.charAt(0).toUpperCase() + name.slice(1);
const typesFileName = file =>
  file.replace('Schema', 'Type').replace('.js', '.ts').replace('.ts', '.d.ts');
const typeImportRegex = /import\s*\{[^}]*\}\s*from\s*'([^']*Schemas?)\.js';/;
const typeImportFindRegex = /import\s*\{[^}]*\}\s*from\s*'([^']*Schemas?)\.js';/g;

const resolveSchemaPath = importPath => {
  let resolved = importPath;
  if (resolved.endsWith('.js')) resolved = resolved.slice(0, -3);

  if (resolved.startsWith('#shared/')) {
    resolved = path.join(projectRoot, 'app/shared', resolved.slice(8));
  } else if (resolved.startsWith('#api/')) {
    resolved = path.join(projectRoot, 'app/api', resolved.slice(5));
  } else if (resolved.startsWith('#app/')) {
    resolved = path.join(projectRoot, 'app/react', resolved.slice(5));
  } else {
    resolved = path.join(`${rootPath}/app`, resolved);
  }

  const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
  for (const ext of extensions) {
    if (fs.existsSync(resolved + ext)) return resolved + ext;
  }
  return resolved;
};

const typeImports = matches => {
  if (!(matches && matches.length)) {
    return '';
  }
  return matches.reduce((res, match) => {
    try {
      const file = match.match(typeImportRegex)[1];
      const typeFile = typesFileName(file);
      const resolvedPath = resolveSchemaPath(file);
      const schemas = require(resolvedPath);
      let final = match.replace(file, typeFile);
      Object.entries(schemas).forEach(([name, schema]) => {
        if (name.match(/Schema/)) {
          final = final.replace(name, schema.title || firstUp(name));
        }
      });
      return `${res}\n${final}\n`;
    } catch (e) {
      console.warn(`Warning: Could not process import ${match}: ${e.message}`);
      return res;
    }
  }, '');
};

const checkTypeFile = (file, content) => {
  const endProcess = () => {
    console.error(`Must emit types: ${file} changed`);
    process.exit(1);
  };

  if (fs.existsSync(path.join(__dirname, file))) {
    const oldContent = fs.readFileSync(path.join(__dirname, file)).toString();

    if (oldContent !== content) endProcess();
  } else {
    endProcess();
  }
};

const writeTypeFile = (file, commonImport, snippets) => {
  const goodSnippets = snippets.filter(p => p);
  if (goodSnippets.length) {
    const typeFile = typesFileName(file);
    const customImport = customImports[file] ? `${customImports[file].join('\n')}\n` : '';
    if (!dryCheck) {
      console.log(`Emitting ${goodSnippets.length} types from ${file} to ${typeFile}.`);
    }

    const content =
      banner + customImport + commonImport + goodSnippets.reduce((res, s) => `${res}\n${s}`, '');

    if (dryCheck) {
      checkTypeFile(typeFile, content);
    } else {
      fs.writeFileSync(path.join(__dirname, typeFile), content);
    }
  }
};

const writeSchema = async (schemas, file) => {
  const snippets = await Promise.all(
    Object.entries(schemas).map(([name, schema]) => {
      if (!name.match(/Schema$/)) {
        return '';
      }
      return compile(schema, schema.title || firstUp(name), opts);
    })
  );

  const contents = fs.readFileSync(path.join(__dirname, file)).toString();
  writeTypeFile(file, typeImports(contents.match(typeImportFindRegex)), snippets);
};

const emitSchemaTypes = async file => {
  try {
    if (file.match(/spec/) || file.match(/\.d\.ts$/) || file.match(/Validator\.ts$/)) {
      return;
    }

    if (file.match(/shared\/types/) || file.match(/Schema/)) {
      const schemas = require(file);
      if (!schemas.emitSchemaTypes) {
        return;
      }
      writeSchema(schemas, file);
    }
  } catch (err) {
    console.error(`Failed emitting types from ${file}: ${err}.`);
  }
};

function walk(dir, callback) {
  fs.readdir(dir, (err, files) => {
    if (err) throw err;
    files.forEach(file => {
      const filepath = path.join(dir, file);
      fs.stat(filepath, (err2, stats) => {
        if (err2) throw err2;
        if (stats.isDirectory()) {
          walk(filepath, callback);
        } else if (stats.isFile()) {
          callback(path.join(rootPath, filepath), stats);
        }
      });
    });
  });
}

walk('./app', emitSchemaTypes);
