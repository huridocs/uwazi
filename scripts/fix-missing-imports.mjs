import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { execSync } from 'child_process';

const importMap = {
  TransactionManagerFactory: '#api/core/infrastructure/factories/TransactionManagerFactory.js',
  IdGeneratorFactory: '#api/core/infrastructure/factories/IdGeneratorFactory.js',
  TemplatesDataSourceFactory: '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js',
  SettingsDataSourceFactory: '#api/core/infrastructure/factories/SettingsDataSourceFactory.js',
  FilesDataSourceFactory: '#api/core/infrastructure/factories/FilesDataSourceFactory.js',
  getConnection: '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js',
  UserSchema: '#shared/types/userType.js',
  PropertyTypeEnum: '#api/core/domain/template/PropertyType.js',
  LoggerFactory: '#api/core/libs/logger/LoggerFactory.js',
  DefaultDispatcher: '#api/core/libs/queue/configuration/factories.js',
  tenants: '#api/tenants/index.js',
  permissionsContext: '#api/permissions/permissionsContext.js',
  applicationEventsBus: '#api/core/libs/eventsbus/index.js',
  DefaultRelationshipTypesDataSource: '#api/relationshiptypes.v2/database/data_source_defaults.js',
  DefaultTranslationsDataSource: '#api/translations.v2/database/data_source_defaults.js',
  DefaultEntitiesDataSource: '#api/entities.v2/database/data_source_defaults.js',
  DefaultFilesDataSource: '#api/files.v2/database/data_source_defaults.js',
  DefaultSettingsDataSource: '#api/settings.v2/database/data_source_defaults.js',
  MongoThesauriDataSource: '#api/core/infrastructure/mongodb/thesauri/MongoThesauriDS.js',
  MongoMultiLanguageEntityDataSource: '#api/entities.v2/database/MongoMultiLanguageEntityDataSource.js',
  MongoRelationshipsV1DataSource: '#api/core/infrastructure/mongodb/MongoRelationshipsV1DataSource.js',
  SyncDispatcherForTests: '#api/core/libs/queue/application/contracts/SyncDispatcherForTests.js',
  JobsDispatcher: '#api/core/libs/queue/application/contracts/JobsDispatcher.js',
};

function getTypeScriptErrors() {
  try {
    const output = execSync('yarn check-app-types 2>&1', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    const errors = [];
    const lines = output.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const ts2304Match = line.match(/error TS2304.*Cannot find name '([^']+)'/);
      if (ts2304Match) {
        const fileNameMatch = lines[i - 1]?.match(/\[96m([^\[]+)\[0m/);
        const lineNumMatch = line.match(/\[93m(\d+)\[0m/);
        if (fileNameMatch && lineNumMatch) {
          errors.push({
            file: fileNameMatch[1].trim(),
            line: parseInt(lineNumMatch[1]),
            name: ts2304Match[1],
          });
        }
      }
    }
    
    return errors;
  } catch (error) {
    return [];
  }
}

function addImportToFile(filePath, importName, importPath) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const existingImportIndex = lines.findIndex(line => 
      line.includes(`from '${importPath}'`) || line.includes(`from "${importPath}"`)
    );
    
    if (existingImportIndex !== -1) {
      const importLine = lines[existingImportIndex];
      if (importLine.includes(`{ ${importName} }`) || importLine.includes(`{${importName}}`)) {
        return false;
      }
      
      const namedImportMatch = importLine.match(/import\s+\{([^}]+)\}\s+from/);
      if (namedImportMatch) {
        const imports = namedImportMatch[1].split(',').map(i => i.trim());
        if (!imports.includes(importName)) {
          imports.push(importName);
          lines[existingImportIndex] = importLine.replace(
            /\{([^}]+)\}/,
            `{ ${imports.join(', ')} }`
          );
          writeFileSync(filePath, lines.join('\n'), 'utf-8');
          return true;
        }
      }
    }
    
    let lastImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^import\s+/)) {
        lastImportIndex = i;
      } else if (lastImportIndex !== -1 && lines[i].trim() === '') {
        break;
      }
    }
    
    const newImport = `import { ${importName} } from '${importPath}';`;
    
    if (lastImportIndex === -1) {
      lines.unshift(newImport, '');
    } else {
      lines.splice(lastImportIndex + 1, 0, newImport);
    }
    
    writeFileSync(filePath, lines.join('\n'), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Analyzing TypeScript errors for missing imports...\n');
  
  const errors = getTypeScriptErrors();
  console.log(`Found ${errors.length} TS2304 errors (Cannot find name)\n`);
  
  const fixes = new Map();
  
  for (const error of errors) {
    if (importMap[error.name]) {
      const key = `${error.file}:${error.name}`;
      if (!fixes.has(key)) {
        fixes.set(key, {
          file: error.file,
          name: error.name,
          importPath: importMap[error.name],
        });
      }
    }
  }
  
  console.log(`📝 Found ${fixes.size} fixable missing imports\n`);
  
  let fixedCount = 0;
  for (const fix of fixes.values()) {
    if (addImportToFile(fix.file, fix.name, fix.importPath)) {
      fixedCount++;
      console.log(`✅ Fixed: ${fix.file} - added import for ${fix.name}`);
    }
  }
  
  console.log(`\n✨ Fixed ${fixedCount} files`);
  console.log(`\n🔄 Re-running type check to verify fixes...\n`);
}

main().catch(console.error);
