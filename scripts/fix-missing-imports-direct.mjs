import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { execSync } from 'child_process';

const importMap = {
  TransactionManagerFactory: '#api/core/infrastructure/factories/TransactionManagerFactory.js',
  IdGeneratorFactory: '#api/core/infrastructure/factories/IdGeneratorFactory.js',
  TemplatesDataSourceFactory: '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js',
  SettingsDataSourceFactory: '#api/core/infrastructure/factories/SettingsDataSourceFactory.js',
  FilesDataSourceFactory: '#api/core/infrastructure/factories/FilesDataSourceFactory.js',
  FilesServiceFactory: '#api/core/infrastructure/factories/FilesServiceFactory.js',
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

function hasImport(content, name, importPath) {
  const importRegex = new RegExp(`import\\s+.*\\b${name}\\b.*from\\s+['"]${importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`);
  return importRegex.test(content);
}

function addImportToFile(filePath, importName, importPath) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    
    if (hasImport(content, importName, importPath)) {
      return false;
    }
    
    if (!content.includes(importName)) {
      return false;
    }
    
    const lines = content.split('\n');
    
    const existingImportIndex = lines.findIndex(line => 
      line.includes(`from '${importPath}'`) || line.includes(`from "${importPath}"`)
    );
    
    if (existingImportIndex !== -1) {
      const importLine = lines[existingImportIndex];
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
      return false;
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
  console.log('🔍 Searching for files with missing imports...\n');
  
  const files = await glob('app/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/prod/**', '**/coverage/**'],
  });
  
  console.log(`📁 Checking ${files.length} files...\n`);
  
  let totalFixed = 0;
  const fixesByFile = new Map();
  
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const fixes = [];
      
      for (const [name, importPath] of Object.entries(importMap)) {
        if (content.includes(name) && !hasImport(content, name, importPath)) {
          const regex = new RegExp(`\\b${name}\\b`);
          if (regex.test(content)) {
            fixes.push({ name, importPath });
          }
        }
      }
      
      if (fixes.length > 0) {
        fixesByFile.set(file, fixes);
      }
    } catch (error) {
      console.error(`Error reading ${file}: ${error.message}`);
    }
  }
  
  console.log(`📝 Found ${fixesByFile.size} files needing imports\n`);
  
  for (const [file, fixes] of fixesByFile.entries()) {
    for (const fix of fixes) {
      if (addImportToFile(file, fix.name, fix.importPath)) {
        totalFixed++;
        console.log(`✅ ${file}: added import for ${fix.name}`);
      }
    }
  }
  
  console.log(`\n✨ Fixed ${totalFixed} import statements across ${fixesByFile.size} files`);
}

main().catch(console.error);
