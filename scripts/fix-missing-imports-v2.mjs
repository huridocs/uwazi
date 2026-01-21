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

function stripAnsi(str) {
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

function getTypeScriptErrors() {
  try {
    const output = execSync('yarn check-app-types 2>&1', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    const cleanOutput = stripAnsi(output);
    const errors = [];
    const lines = cleanOutput.split('\n');
    
    let currentFile = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      const fileMatch = line.match(/^([^\s:]+):(\d+):(\d+)\s+-\s+error\s+TS2304:/);
      if (fileMatch) {
        currentFile = fileMatch[1];
        const nameMatch = lines[i + 1]?.match(/Cannot find name '([^']+)'/);
        if (nameMatch) {
          errors.push({
            file: currentFile,
            line: parseInt(fileMatch[2]),
            name: nameMatch[1],
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
        const imports = namedImportMatch[1].split(',').map(i => i.trim()).filter(i => i);
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
      } else if (lastImportIndex !== -1 && lines[i].trim() === '' && i > lastImportIndex + 1) {
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
  
  const nameCounts = {};
  for (const error of errors) {
    nameCounts[error.name] = (nameCounts[error.name] || 0) + 1;
  }
  
  console.log('Top missing names:');
  Object.entries(nameCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([name, count]) => {
      console.log(`  ${name}: ${count} occurrences`);
    });
  console.log();
  
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
}

main().catch(console.error);
