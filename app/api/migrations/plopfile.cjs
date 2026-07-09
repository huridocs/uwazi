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

const kebabCaseName = (name) => name
  .trim()
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .toLowerCase();

module.exports = (plop) => {
  let currentTenantDelta;
  plop.setHelper('nextMigrationDelta', () => {
    if (currentTenantDelta) {
      return currentTenantDelta;
    }

    const migrationsDir = path.join(__dirname, 'migrations');
    currentTenantDelta = getLatestDelta(migrationsDir) + 1;
    return currentTenantDelta;
  });

  let currentSchemaDelta;
  plop.setHelper('nextSchemaDelta', () => {
    if (currentSchemaDelta) {
      return currentSchemaDelta;
    }

    const pgMigrationsDir = path.join(__dirname, '../core/infrastructure/postgresql/schema_migrations');
    currentSchemaDelta = getLatestDelta(pgMigrationsDir) + 1;
    return currentSchemaDelta;
  });

  plop.setHelper('latestPgSchemaDelta', () => {
    const pgMigrationsDir = path.join(__dirname, '../core/infrastructure/postgresql/schema_migrations');
    return getLatestDelta(pgMigrationsDir);
  });

  plop.setHelper('dashName', (name) => kebabCaseName(name));

  plop.setGenerator('migration', {
    description: 'migration',
    prompts: [
      {
        type: 'list',
        name: 'kind',
        message: 'what kind of migration do you want to create?',
        choices: ['data', 'schema'],
        default: 'data',
      },
      {
        type: 'input',
        name: 'name',
        message: 'name for the migration',
        validate: (input) => {
          const name = kebabCaseName(input);
          if (!name) {
            return 'migration name is required';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'description for the migration',
      },
    ],
    actions: (answers) => {
      if (answers.kind === 'schema') {
        return [
          {
            type: 'add',
            path: '../core/infrastructure/postgresql/schema_migrations/{{nextSchemaDelta}}-{{dashName name}}.sql',
            templateFile: './templates/schema-migration.txt',
          },
        ];
      }

      return [
        {
          type: 'add',
          path: './migrations/{{nextMigrationDelta}}-{{dashName name}}/index.ts',
          templateFile: './templates/migration.txt',
        },
        {
          type: 'add',
          path: './migrations/{{nextMigrationDelta}}-{{dashName name}}/types.ts',
          templateFile: './templates/types.txt',
        },
        {
          type: 'add',
          path: './migrations/{{nextMigrationDelta}}-{{dashName name}}/specs/{{nextMigrationDelta}}-{{dashName name}}.spec.ts',
          templateFile: './templates/migration.spec.txt',
        },
        {
          type: 'add',
          path: './migrations/{{nextMigrationDelta}}-{{dashName name}}/specs/fixtures.ts',
          templateFile: './templates/fixtures.txt',
        },
      ];
    },
  });
};
