/* eslint-disable import/no-dynamic-require, global-require */

require('@babel/register')({ extensions: ['.js', '.jsx', '.ts', '.tsx'] });

module.exports = plop => {
  let currentDelta;
  plop.setHelper('nextMigrationDelta', () => {
    if (currentDelta) {
      return currentDelta;
    }

    const fs = require('fs');
    const path = require('path');
    const { migrator } = require('./migrator');

    const { migrationsDir } = migrator;
    let migrations = fs.readdirSync(migrationsDir);
    migrations = migrations
      .map(migration => {
        try {
          return require(path.join(migrationsDir, migration)).default.delta;
        } catch (e) {
          return null;
        }
      })
      .filter(m => m)
      .sort((a, b) => b - a);
    currentDelta = migrations.length ? migrations[0] + 1 : 1;
    return currentDelta;
  });

  plop.setGenerator('migration', {
    description: 'migration',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'name for the migration',
      },
      {
        type: 'input',
        name: 'description',
        message: 'description for the migration',
      },
    ],
    actions: [
      {
        type: 'add',
        path: './migrations/{{nextMigrationDelta}}-{{name}}/index.ts',
        templateFile: './templates/migration.txt',
      },
      {
        type: 'add',
        path: './migrations/{{nextMigrationDelta}}-{{name}}/types.ts',
        templateFile: './templates/types.txt',
      },
      {
        type: 'add',
        path: './migrations/{{nextMigrationDelta}}-{{name}}/specs/{{nextMigrationDelta}}-{{name}}.spec.ts',
        templateFile: './templates/migration.spec.txt',
      },
      {
        type: 'add',
        path: './migrations/{{nextMigrationDelta}}-{{name}}/specs/fixtures.ts',
        templateFile: './templates/fixtures.txt',
      },
    ],
  });
};
