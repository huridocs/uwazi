import { Translation, TranslationContext } from '#api/core/domain/translation/Translation.js';
import { DuplicatedKeyError } from '#api/common.v2/errors/DuplicatedKeyError.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresTable } from '../../common/PostgresTable.js';
import { PostgresTransactionManager } from '../../common/PostgresTransactionManager.js';
import {
  CLONE_BATCH_SIZE,
  PostgresTranslationsDataSource,
} from '../PostgresTranslationsDataSource.js';

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

afterEach(() => {
  jest.restoreAllMocks();
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

  it('should clone in batches of CLONE_BATCH_SIZE', async () => {
    const ds = makeDS();
    await ds.insert(
      Array.from({ length: CLONE_BATCH_SIZE + 1 }, (_, i) =>
        translation(`key-${i}`, `key-${i}`, 'en')
      )
    );

    const upsertSpy = jest.spyOn(PostgresTable.prototype, 'upsert');
    await ds.cloneForLanguage('en', 'es');

    const cloneCalls = upsertSpy.mock.calls.filter(([rows]) => Array.isArray(rows));
    expect(cloneCalls.map(([rows]) => (rows as unknown[]).length)).toEqual([CLONE_BATCH_SIZE, 1]);
    expect(await ds.getByLanguage('es')).toHaveLength(CLONE_BATCH_SIZE + 1);
    upsertSpy.mockRestore();
  });

  it('should leave earlier batches committed when clone fails without an outer run()', async () => {
    const ds = makeDS();
    await ds.insert(
      Array.from({ length: CLONE_BATCH_SIZE + 1 }, (_, i) =>
        translation(`key-${i}`, `key-${i}`, 'en')
      )
    );

    const originalUpsert = PostgresTable.prototype.upsert;
    jest.spyOn(PostgresTable.prototype, 'upsert').mockImplementation(async function failLaterBatch(
      this: PostgresTable,
      doc,
      conflict
    ) {
      const rows = Array.isArray(doc) ? doc : [doc];
      if (rows.length < CLONE_BATCH_SIZE) {
        throw new Error('second clone batch failed');
      }
      return originalUpsert.call(this, doc, conflict);
    });

    await expect(ds.cloneForLanguage('en', 'es')).rejects.toThrow('second clone batch failed');
    expect(await ds.getByLanguage('es')).toHaveLength(CLONE_BATCH_SIZE);
    jest.restoreAllMocks();
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
