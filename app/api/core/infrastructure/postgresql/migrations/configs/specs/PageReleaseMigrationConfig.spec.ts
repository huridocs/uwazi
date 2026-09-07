import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { MigrateCollectionToPostgres } from '../../MigrateCollectionToPostgres.js';
import { PageReleaseMigrationConfig } from '../PageReleaseMigrationConfig.js';

const releaseDoc = (id: ObjectId, pageId: ObjectId, userId: ObjectId) => ({
  _id: id,
  page: pageId,
  version: 2,
  release_message: 'a release',
  user: userId,
  date: 1700000000,
  en: { title: 'Title EN', content: '<p>EN</p>', script: 'en.js', css: 'en.css' },
  es: { title: 'Title ES', content: '<p>ES</p>' },
});

describe('PageReleaseMigrationConfig', () => {
  it('should flatten a mongo page_releases doc gathering the languages into locales', () => {
    const id = new ObjectId();
    const pageId = new ObjectId();
    const userId = new ObjectId();

    const mapped = PageReleaseMigrationConfig.mapDocument(releaseDoc(id, pageId, userId));

    expect(PageReleaseMigrationConfig.mongoCollection).toBe('page_releases');
    expect(PageReleaseMigrationConfig.pgTable).toBe('page_releases');
    expect(mapped).toEqual({
      _id: id.toHexString(),
      page_id: pageId.toHexString(),
      version: 2,
      release_message: 'a release',
      user_id: userId.toHexString(),
      date: 1700000000,
      locales: JSON.stringify({
        en: { title: 'Title EN', draft: { content: '<p>EN</p>', script: 'en.js', css: 'en.css' } },
        es: { title: 'Title ES', draft: { content: '<p>ES</p>', script: '', css: '' } },
      }),
    });
  });

  it('should default a missing release message and user', () => {
    const mapped = PageReleaseMigrationConfig.mapDocument({
      _id: 'abc123',
      page: 'page-1',
      version: 1,
      date: 1700000000,
    });

    expect(mapped).toMatchObject({
      _id: 'abc123',
      page_id: 'page-1',
      release_message: '',
      user_id: null,
      locales: '{}',
    });
  });

  it('should ignore language keys that carry no content', () => {
    const mapped = PageReleaseMigrationConfig.mapDocument({
      _id: 'abc123',
      page: 'page-1',
      version: 1,
      date: 1700000000,
      en: { title: 'Title EN', content: '<p>EN</p>' },
      notALanguage: 'just a string',
    });

    expect(JSON.parse(mapped.locales as string)).toEqual({
      en: { title: 'Title EN', draft: { content: '<p>EN</p>', script: '', css: '' } },
    });
  });
});

describe('PageReleaseMigrationConfig copy', () => {
  const TENANT = 'page-releases-migration-tenant';

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  beforeEach(async () => {
    await testingDB.clear(['page_releases']);
    await testingPG.clear(['page_releases']);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should copy releases keeping the locales in the jsonb column', async () => {
    const id = new ObjectId();
    const pageId = new ObjectId();
    const userId = new ObjectId();
    await testingDB
      .db(testingDB.dbName)
      .collection('page_releases')
      .insertOne(releaseDoc(id, pageId, userId));

    const migrator = new MigrateCollectionToPostgres(testingDB.db(testingDB.dbName), TENANT);
    expect(await migrator.migrate(PageReleaseMigrationConfig)).toEqual({
      migrated: 1,
      skipped: false,
    });

    const rows = (await testingPG.getAllFrom('page_releases')).filter(r => r.tenant_id === TENANT);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      _id: id.toHexString(),
      page_id: pageId.toHexString(),
      version: 2,
      release_message: 'a release',
      user_id: userId.toHexString(),
      date: 1700000000,
      locales: {
        en: { title: 'Title EN', draft: { content: '<p>EN</p>', script: 'en.js', css: 'en.css' } },
        es: { title: 'Title ES', draft: { content: '<p>ES</p>', script: '', css: '' } },
      },
    });
  });
});
