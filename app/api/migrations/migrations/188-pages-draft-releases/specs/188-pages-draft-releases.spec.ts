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

  it('should have delta 188', () => {
    expect(migration.delta).toBe(188);
  });

  it('should set draft, releases, disableMarkdown and unset legacy fields', async () => {
    const page = await db!.collection('pages').findOne({ _id: pageId });
    expect(page).not.toBeNull();
    expect(page!.draft).toEqual({
      content: '<p>hi</p>',
      script: 'console.log(1)',
      css: 'body{}',
    });
    expect(page!.releases).toHaveLength(1);
    expect(page!.releases[0].version).toBe(1);
    expect(page!.releases[0].content).toBe('<p>hi</p>');
    expect(page!.releases[0].release_message).toContain('migration');
    expect(page!.releases[0].user?.toString()).toBe(userId.toString());
    expect(page!.releases[0].date).toBe(1000);
    expect(page!.disableMarkdown).toBe(true);
    expect(page!.version).toBeUndefined();
    expect(page!.metadata?.content).toBeUndefined();
  });

  it('should be idempotent', async () => {
    await migration.up(db!);
    const page = await db!.collection('pages').findOne({ _id: pageId });
    expect(page!.releases).toHaveLength(1);
  });
});
