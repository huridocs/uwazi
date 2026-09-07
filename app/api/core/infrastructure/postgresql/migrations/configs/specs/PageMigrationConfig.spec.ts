import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { MigrateCollectionToPostgres } from '../../MigrateCollectionToPostgres.js';
import { PageLocalesMigrationConfig, PageMigrationConfig } from '../PageMigrationConfig.js';

const pageDoc = (id: ObjectId) => ({
  _id: id,
  sharedId: 'shared-1',
  creationDate: 1700000000,
  entityView: true,
  markdownSupport: true,
  locales: {
    en: { title: 'Title EN', draft: { content: '<p>EN</p>', script: 'en.js', css: 'en.css' } },
    es: { title: 'Title ES', draft: { content: '<p>ES</p>', script: '', css: '' } },
  },
});

describe('PageMigrationConfig', () => {
  it('should flatten a mongo pages doc to a pages row', () => {
    const id = new ObjectId();

    const mapped = PageMigrationConfig.mapDocument(pageDoc(id));

    expect(PageMigrationConfig.mongoCollection).toBe('pages');
    expect(PageMigrationConfig.pgTable).toBe('pages');
    expect(mapped).toEqual({
      _id: id.toHexString(),
      shared_id: 'shared-1',
      creation_date: 1700000000,
      entity_view: true,
      markdown_support: true,
    });
  });

  it('should stringify non-ObjectId ids and default missing fields', () => {
    const mapped = PageMigrationConfig.mapDocument({ _id: 'abc123', sharedId: 'shared-1' });

    expect(mapped).toEqual({
      _id: 'abc123',
      shared_id: 'shared-1',
      creation_date: null,
      entity_view: false,
      markdown_support: false,
    });
  });
});

describe('PageLocalesMigrationConfig', () => {
  it('should fan a doc out into one row per language', () => {
    const id = new ObjectId();

    const rows = PageLocalesMigrationConfig.mapRows(pageDoc(id));

    expect(PageLocalesMigrationConfig.mongoCollection).toBe('pages');
    expect(PageLocalesMigrationConfig.pgTable).toBe('page_locales');
    expect(rows).toEqual([
      {
        page_id: id.toHexString(),
        language: 'en',
        title: 'Title EN',
        draft_content: '<p>EN</p>',
        draft_script: 'en.js',
        draft_css: 'en.css',
      },
      {
        page_id: id.toHexString(),
        language: 'es',
        title: 'Title ES',
        draft_content: '<p>ES</p>',
        draft_script: '',
        draft_css: '',
      },
    ]);
  });

  it('should default missing title and draft fields', () => {
    const rows = PageLocalesMigrationConfig.mapRows({
      _id: 'abc123',
      locales: { en: {} },
    });

    expect(rows).toEqual([
      {
        page_id: 'abc123',
        language: 'en',
        title: '',
        draft_content: '',
        draft_script: '',
        draft_css: '',
      },
    ]);
  });

  it('should produce no rows for a page without locales', () => {
    expect(PageLocalesMigrationConfig.mapRows({ _id: 'abc123' })).toEqual([]);
    expect(PageLocalesMigrationConfig.mapRows({ _id: 'abc123', locales: {} })).toEqual([]);
  });
});

describe('PageMigrationConfig copy', () => {
  const TENANT = 'pages-migration-tenant';

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingDB.clear(['pages']);
    await testingPG.clear(['pages', 'page_locales']);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const makeMigrator = () =>
    new MigrateCollectionToPostgres(testingDB.db(testingDB.dbName), TENANT);

  it('should copy pages and their locales', async () => {
    const id = new ObjectId();
    await testingDB.db(testingDB.dbName).collection('pages').insertOne(pageDoc(id));

    expect(await makeMigrator().migrate(PageMigrationConfig)).toEqual({
      migrated: 1,
      skipped: false,
    });
    expect(await makeMigrator().migrate(PageLocalesMigrationConfig)).toEqual({
      migrated: 1,
      skipped: false,
    });

    const pages = (await testingPG.getAllFrom('pages')).filter(r => r.tenant_id === TENANT);
    expect(pages).toHaveLength(1);
    expect(pages[0]).toMatchObject({
      _id: id.toHexString(),
      shared_id: 'shared-1',
      creation_date: 1700000000,
      entity_view: true,
      markdown_support: true,
    });

    const locales = (await testingPG.getAllFrom('page_locales')).filter(
      r => r.tenant_id === TENANT
    );
    expect(locales).toHaveLength(2);
    expect(locales.map(row => row.language).sort()).toEqual(['en', 'es']);
  });
});
