import { Translation, TranslationContext } from '#api/core/domain/translation/Translation.js';
import { DuplicatedKeyError } from '#api/common.v2/errors/DuplicatedKeyError.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresTransactionManager } from '../../common/PostgresTransactionManager.js';
import { PostgresTranslationsDataSource } from '../PostgresTranslationsDataSource.js';

const TENANT_ID = 'test-tenant';

const entityContext: TranslationContext = {
  id: 'template-1',
  label: 'Case',
  type: 'Entity',
};
const systemContext: TranslationContext = {
  id: 'System',
  label: 'User Interface',
  type: 'Uwazi UI',
};
const thesaurusContext: TranslationContext = {
  id: 'thesaurus-1',
  label: 'CPV',
  type: 'Thesaurus',
};

const managerFor = (tenantId: string) =>
  new PostgresTransactionManager(PostgresDB.knex, tenantId, LoggerFactory.forTests());

const makeDS = (tenantId = TENANT_ID) =>
  new PostgresTranslationsDataSource({
    tenantId,
    mongoDb: getConnection(),
    pgTransactionManager: managerFor(tenantId),
    idGenerator: IdGeneratorFactory.default(),
  });

const translation = (
  key: string,
  value: string,
  language: 'en' | 'es',
  context: TranslationContext = entityContext
) => new Translation(key, value, language, context);

beforeAll(async () => {
  await testingEnvironment.setUp({}, { postgres: true });
});

beforeEach(async () => {
  await testingEnvironment.setUp({});
  await testingPG.clear(['translations']);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('PostgresTranslationsDataSource', () => {
  it('should insert and read by language, context, and natural key', async () => {
    const ds = makeDS();
    await ds.insert([
      translation('Case', 'Case', 'en'),
      translation('Case', 'Caso', 'es'),
      translation('Search', 'Search', 'en', systemContext),
    ]);

    const english = await ds.getByLanguage('en');
    expect(english.map(row => row.value).sort()).toEqual(['Case', 'Search']);

    const contextRows = await ds.getByContext(entityContext.id);
    expect(contextRows).toHaveLength(2);

    const scoped = await ds.getByLanguageAndContext('es', entityContext.id);
    expect(scoped).toEqual([translation('Case', 'Caso', 'es')]);
  });

  it('should omit excluded context types', async () => {
    const ds = makeDS();
    await ds.insert([
      translation('Search', 'Buscar', 'es', systemContext),
      translation('Case', 'Caso', 'es'),
      translation('Apple', 'Manzana', 'es', thesaurusContext),
    ]);

    const rows = await ds.getByLanguageExcludingContextTypes('es', ['Thesaurus']);
    expect(rows.map(row => row.context.id).sort()).toEqual(['System', entityContext.id]);
  });

  it('should upsert by natural key without duplicating rows', async () => {
    const ds = makeDS();
    await ds.insert([translation('Title', 'Title', 'en')]);
    const originalId = (await testingPG.getAllFrom('translations'))[0]._id;

    await ds.upsert([
      translation('Title', 'Title updated', 'en'),
      translation('Title', 'Título', 'es'),
    ]);

    const rows = await testingPG.getAllFrom('translations');
    expect(rows).toHaveLength(2);
    expect(rows.map(row => row.value).sort()).toEqual(['Title updated', 'Título']);
    expect(rows.find(row => row.language === 'en')?._id).toBe(originalId);
  });

  it('should throw DuplicatedKeyError when inserting an existing natural key', async () => {
    const ds = makeDS();
    await ds.insert([translation('Title', 'Title', 'en')]);

    await expect(ds.insert([translation('Title', 'Other', 'en')])).rejects.toBeInstanceOf(
      DuplicatedKeyError
    );
  });

  it('should clone a language without overwriting existing keys', async () => {
    const ds = makeDS();
    await ds.insert([
      translation('Title', 'Title', 'en'),
      translation('Title', 'Título', 'es'),
      translation('Name', 'Name', 'en'),
    ]);

    await ds.cloneForLanguage('en', 'es');

    const spanish = await ds.getByLanguage('es');
    expect(spanish).toEqual(
      expect.arrayContaining([
        translation('Title', 'Título', 'es'),
        translation('Name', 'Name', 'es'),
      ])
    );
    expect(spanish).toHaveLength(2);
  });

  it('should calculate missing keys across languages', async () => {
    const ds = makeDS();
    await ds.insert([translation('Title', 'Title', 'en')]);

    await expect(ds.calculateNonexistentKeys(entityContext.id, ['Title', 'Name'])).resolves.toEqual(
      ['Name']
    );
    await expect(ds.calculateNonexistentKeys(entityContext.id, [])).resolves.toEqual([]);
  });

  it('should isolate tenants via RLS', async () => {
    const tenantA = makeDS('tenant-a');
    const tenantB = makeDS('tenant-b');

    await tenantA.insert([translation('Title', 'Title', 'en')]);

    expect(await tenantA.getByLanguage('en')).toHaveLength(1);
    expect(await tenantB.getByLanguage('en')).toEqual([]);
  });
});
