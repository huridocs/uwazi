import { Db } from 'mongodb';
import testingDB from '#api/utils/testing_db.js';
import migration from '../index.js';
import { fixtures, pageId, userId } from './fixtures.js';

let db: Db | null;

describe('migration pages-draft-releases', () => {
  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await testingDB.setupFixturesAndContext(fixtures);
    db = testingDB.mongodb!;
    await migration.up(db);
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have delta 191', () => {
    expect(migration.delta).toBe(191);
  });

  it('should consolidate to locales and page_releases', async () => {
    const page = await db!.collection('pages').findOne({ _id: pageId });
    expect(page).not.toBeNull();
    expect(page!.locales?.en?.draft).toEqual({
      content: '<p>hi</p>',
      script: '/* page script */',
      css: 'body{}',
    });
    expect(page!.locales?.en?.title).toBe('Test');
    expect(page!.releases).toBeUndefined();
    expect(page!.language).toBeUndefined();
    expect(page!.markdownSupport).toBe(true);
    expect(page!.user).toBeUndefined();

    const releases = await db!.collection('page_releases').find({ page: pageId }).toArray();
    expect(releases).toHaveLength(1);
    expect(releases[0].version).toBe(1);
    expect(releases[0].en?.content).toBe('<p>hi</p>');
    expect(releases[0].release_message).toContain('migration');
    expect(releases[0].user?.toString()).toBe(userId.toString());
    expect(releases[0].date).toBe(1000);
  });

  it('should be idempotent for already migrated pages', async () => {
    await migration.up(db!);
    const count = await db!.collection('pages').countDocuments({ sharedId: 'mig-page-1' });
    expect(count).toBe(1);
  });
});
