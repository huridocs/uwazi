/* eslint-disable max-statements */
import { Db } from 'mongodb';
import testingDB from '#api/utils/testing_db.js';
import migration from '../index.js';
import { alreadyCorrectFixtures, fixtures } from './fixtures.js';

let db: Db | null;

const setUpAndRun = async (fixture: any) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb;
  migration.reindex = false;
  await migration.up(db!);
};

beforeAll(async () => {
  jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration repair_denormalized_icon_id_in_metadata', () => {
  it('should have a delta number', () => {
    expect(migration.delta).toBe(189);
  });

  it('should rewrite icon.id to icon._id only for matching metadata array entries', async () => {
    await setUpAndRun(fixtures);

    const all = await db!.collection('entities').find({}).toArray();
    const byTitle = Object.fromEntries(all.map(entity => [entity.title, entity]));

    expect(byTitle.simple_repair.metadata.rel).toEqual([
      { value: 'entityA', label: 'Entity A', icon: { _id: 'flag_a', label: 'Flag A' } },
    ]);

    expect(byTitle.multi_property_repair.metadata.relA).toEqual([
      {
        value: 'entityA',
        label: 'Entity A',
        icon: { _id: 'flag_a', label: 'Flag A', type: 'img' },
      },
    ]);
    expect(byTitle.multi_property_repair.metadata.relB).toEqual([
      {
        value: 'entityB',
        label: 'Entity B',
        icon: { _id: 'flag_b', label: 'Flag B', type: 'img' },
      },
    ]);
    expect(byTitle.multi_property_repair.metadata.relB[0].icon.id).toBeUndefined();
    expect(byTitle.multi_property_repair.metadata.relB[0].icon._id).toBe('flag_b');
    expect(byTitle.multi_property_repair.metadata.other).toEqual([{ value: 'plain text' }]);

    expect(byTitle.non_string_id_repair.metadata.rel).toEqual([
      { value: 'entityC', label: 'Entity C', icon: { _id: 456, label: 'Numeric' } },
    ]);

    expect(byTitle.missing_metadata.metadata).toBeUndefined();
    expect(byTitle.null_metadata.metadata).toBeNull();
    expect(byTitle.non_array_property.metadata).toEqual({
      rel: { value: 'entityA', icon: { id: 'icon-a' } },
    });
    expect(byTitle.array_non_object_entries.metadata).toEqual({
      rel: ['not_an_object', 123, null],
    });
    expect(byTitle.entries_without_icon.metadata).toEqual({
      rel: [{ value: 'entityA', label: 'Entity A', type: 'entity' }],
    });
    expect(byTitle.entries_with_icon_without_id.metadata).toEqual({
      rel: [{ value: 'entityA', label: 'Entity A', icon: { _id: 'already_ok', label: 'ok' } }],
    });

    expect(migration.reindex).toBe(true);
  });

  it('should not reindex when nothing needs to be rewritten', async () => {
    await setUpAndRun(alreadyCorrectFixtures);
    expect(migration.reindex).toBe(false);
  });

  it('should be idempotent and avoid reindex on second run', async () => {
    await setUpAndRun(fixtures);
    expect(migration.reindex).toBe(true);

    await migration.up(db!);
    expect(migration.reindex).toBe(false);
  });
});
