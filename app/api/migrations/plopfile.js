/* eslint-disable import/no-dynamic-require, global-require */
require('babel-core/register')();

module.exports = (plop) => {
  // controller generator
  let currentVersion;
  plop.setHelper('nextMigrationVersion', () => {
    if (currentVersion) {
      return currentVersion;
    }

    const fs = require('fs');
    const path = require('path');
    const migrator = require('./migrator');

    const { migrationsDir } = migrator;
    let migrations = fs.readdirSync(migrationsDir);
    migrations = migrations.map((migration) => {
      try {
        return require(path.join(migrationsDir, migration)).version;
      } catch (e) {
        return null;
      }
    }).filter(m => m).sort((a, b) => b - a);
    currentVersion = migrations.length ? migrations[0] + 1 : 1;
    return currentVersion;
  });

  plop.setGenerator('migration', {
    description: 'migration',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'name for the migration'
      },
      {
        type: 'input',
        name: 'description',
        message: 'description for the migration'
      }
    ],
    actions: [
      {
        type: 'add',
        path: './migrations/{{nextMigrationVersion}}-{{name}}/index.js',
        templateFile: './templates/migration.txt'
      },
      {
        type: 'add',
        path: './migrations/{{nextMigrationVersion}}-{{name}}/specs/{{nextMigrationVersion}}-{{name}}.spec.js',
        templateFile: './templates/migration.spec.txt'
      },
      {
        type: 'add',
        path: './migrations/{{nextMigrationVersion}}-{{name}}/specs/fixtures.js',
        templateFile: './templates/fixtures.txt'
      }
    ]
  });
};
