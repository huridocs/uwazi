import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const replacements = [
  { from: /from\s+['"]#api\/common\.v2\/contracts\/IdGenerator\.js['"]/g, to: "from '#api/core/application/contracts/IdGenerator.js'" },
  { from: /from\s+['"]#api\/common\.v2\/contracts\/TransactionManager\.js['"]/g, to: "from '#api/core/application/contracts/TransactionManager.js'" },
  { from: /from\s+['"]#api\/contracts\/IdGenerator\.js['"]/g, to: "from '#api/core/application/contracts/IdGenerator.js'" },
  { from: /from\s+['"]#api\/MongoIdGenerator\.js['"]/g, to: "from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js'" },
  { from: /from\s+['"]#api\/MongoTransactionManager\.js['"]/g, to: "from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js'" },
  { from: /from\s+['"]#api\/templates\.v2\/contracts\/TemplatesDataSource\.js['"]/g, to: "from '#api/core/application/contracts/TemplatesDataSource.js'" },
  { from: /from\s+['"]#api\/templates\.v2\/model\/Template\.js['"]/g, to: "from '#api/core/domain/template/Template.js'" },
  { from: /from\s+['"]#api\/templates\.v2\/model\/Property\.js['"]/g, to: "from '#api/core/domain/template/Property.js'" },
  { from: /from\s+['"]#api\/templates\.v2\/model\/V1RelationshipProperty\.js['"]/g, to: "from '#api/core/domain/template/V1RelationshipProperty.js'" },
  { from: /from\s+['"]#api\/settings\.v2\/contracts\/SettingsDataSource\.js['"]/g, to: "from '#api/core/application/contracts/SettingsDataSource.js'" },
  { from: /from\s+['"]#api\/core\/domain\/template\/propertyCreatorService\/PropertyCreatorServiceStrategy\.js['"]/g, to: "from '#api/core/application/propertyCreatorService/PropertyCreatorServiceStrategy.js'" },
  { from: /from\s+['"]#api\/core\/domain\/template\/propertyCreatorService\/SelectPropertyCreatorService\.js['"]/g, to: "from '#api/core/application/propertyCreatorService/SelectPropertyCreatorService.js'" },
  { from: /from\s+['"]#api\/core\/infrastructure\/mongodb\/template\/Mapper\.js['"]/g, to: "from '#api/core/infrastructure/mongodb/template/Mapper.js'" },
  { from: /from\s+['"]#api\/core\/libs\/logger\/contracts\/PermissionsDataSource\.js['"]/g, to: "from '#api/authorization.v2/contracts/PermissionsDataSource.js'" },
  { from: /from\s+['"]#api\/queue\.v2\/application\/contracts\/JobsDispatcher\.js['"]/g, to: "from '#api/core/libs/queue/application/contracts/JobsDispatcher.js'" },
];

const files = await glob('app/**/*.{ts,tsx,js,jsx}', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/specs/**', '**/*.spec.*'],
});

let totalFixed = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let modified = false;
  
  for (const { from, to } of replacements) {
    const newContent = content.replace(from, to);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }
  
  if (modified) {
    writeFileSync(file, content, 'utf-8');
    totalFixed++;
  }
}

console.log(`✨ Fixed ${totalFixed} files`);
