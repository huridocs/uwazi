const fs = require('fs');
const path = require('path');

const getLatestDelta = (migrationsDir) => {
  const files = fs.readdirSync(migrationsDir);
  const deltas = files
    .map((file) => {
      const match = file.match(/^(\d+)-/);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter((m) => m !== null)
    .sort((a, b) => b - a);

  return deltas.length ? deltas[0] : 0;
};

module.exports = (plop) => {
  let currentDelta;
  plop.setHelper('nextMigrationDelta', () => {
    if (currentDelta) {
      return currentDelta;
    }

    const migrationsDir = path.join(__dirname, 'migrations');
    currentDelta = getLatestDelta(migrationsDir) + 1;
    return currentDelta;
  });

  plop.setHelper('latestPgSchemaDelta', () => {
    const pgMigrationsDir = path.join(__dirname, '../core/infrastructure/postgresql/schema_migrations');
    return getLatestDelta(pgMigrationsDir);
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
