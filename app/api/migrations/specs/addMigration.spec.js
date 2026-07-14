/* eslint-disable max-statements */
const plopfile = require('../plopfile.cjs');

const createFakePlop = () => {
  const helpers = {};
  const generators = {};
  return {
    setHelper(name, fn) {
      helpers[name] = fn;
    },
    setGenerator(name, config) {
      generators[name] = config;
    },
    helpers,
    generators,
  };
};

describe('add-migration generator', () => {
  let plop;

  beforeEach(() => {
    plop = createFakePlop();
    plopfile(plop);
  });

  it('should register a migration generator', () => {
    expect(plop.generators.migration).toBeDefined();
  });

  it('should prompt for migration kind, defaulting to data', () => {
    const kindPrompt = plop.generators.migration.prompts.find(prompt => prompt.name === 'kind');
    expect(kindPrompt).toMatchObject({
      type: 'list',
      choices: ['data', 'schema'],
      default: 'data',
    });
  });

  it('should reject an empty migration name', () => {
    const namePrompt = plop.generators.migration.prompts.find(prompt => prompt.name === 'name');
    expect(namePrompt.validate('   ')).toBe('migration name is required');
  });

  it('should reject a migration name that normalizes to empty', () => {
    const namePrompt = plop.generators.migration.prompts.find(prompt => prompt.name === 'name');
    expect(namePrompt.validate('---')).toBe('migration name is required');
    expect(namePrompt.validate('!@#')).toBe('migration name is required');
  });

  it('should accept a normalized migration name', () => {
    const namePrompt = plop.generators.migration.prompts.find(prompt => prompt.name === 'name');
    expect(namePrompt.validate('my dummy migration')).toBe(true);
    expect(namePrompt.validate('my-dummy-migration')).toBe(true);
    expect(namePrompt.validate('MyDummyMigration')).toBe(true);
  });

  it('should convert names to kebab-case', () => {
    expect(plop.helpers.dashName('My Dummy Migration')).toBe('my-dummy-migration');
    expect(plop.helpers.dashName('already-kebab')).toBe('already-kebab');
    expect(plop.helpers.dashName('  trailing spaces  ')).toBe('trailing-spaces');
  });

  it('should generate a schema migration action when kind is schema', () => {
    const answers = { kind: 'schema', name: 'my dummy migration', description: 'does nothing' };
    const actions = plop.generators.migration.actions(answers);

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      type: 'add',
      path: '../core/infrastructure/postgresql/schema_migrations/{{nextSchemaDelta}}-{{dashName name}}.sql',
      templateFile: './templates/schema-migration.txt',
    });
  });

  it('should generate tenant migration actions when kind is data', () => {
    const answers = { kind: 'data', name: 'my dummy migration', description: 'does nothing' };
    const actions = plop.generators.migration.actions(answers);

    expect(actions).toHaveLength(4);
    expect(actions[0]).toMatchObject({
      type: 'add',
      path: './migrations/{{nextMigrationDelta}}-{{dashName name}}/index.ts',
      templateFile: './templates/migration.txt',
    });
  });

  it('should calculate nextSchemaDelta based on existing schema migrations', () => {
    expect(plop.helpers.nextSchemaDelta()).toBe(5);
  });

  it('should calculate nextMigrationDelta based on existing tenant migrations', () => {
    const nextMigrationDelta = plop.helpers.nextMigrationDelta();
    expect(Number.isInteger(nextMigrationDelta)).toBe(true);
    expect(nextMigrationDelta).toBeGreaterThan(0);
  });

  it('should provide latestPgSchemaDelta for tenant migration requiresSchema', () => {
    expect(plop.helpers.latestPgSchemaDelta()).toBe(4);
  });
});
