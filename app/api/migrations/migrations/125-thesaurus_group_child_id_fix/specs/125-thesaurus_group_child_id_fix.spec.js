import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { dictAId, dictBId, fixtures, unrelatedTemplateId } from './fixtures.js';

describe('migration thesaurus_group_child_id_fix', () => {
  let db;
  let dicts;
  let newIdForA;
  let newIdForB;

  beforeEach(async () => {
    // jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
    db = testingDB.mongodb;
    migration.reindex = false;
    await migration.up(db);
    dicts = await db.collection('dictionaries').find({}).toArray();
    newIdForA = dicts
      .find(d => d._id.toString() === dictAId.toString())
      .values.find(v => v.label === 'A bad_group').id;
    newIdForB = dicts
      .find(d => d._id.toString() === dictBId.toString())
      .values.find(v => v.label === 'B bad_group').id;
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(125);
  });

  it('should fix the dictionaries', async () => {
    expect(dicts).toMatchObject([
      {
        _id: dictAId,
        name: 'Dictionary A',
        values: [
          {
            label: 'A_root_1',
            id: 'A_root_1_id',
          },
          {
            label: 'A_root_2',
            id: 'A_root_2_id',
          },
          {
            label: 'A good_group',
            id: 'A_good_group_id',
            values: [
              {
                label: 'A_good_group_child_1',
                id: 'A_good_group_child_1_id',
              },
            ],
          },
          {
            label: 'A bad_group',
            id: expect.any(String),
            values: [
              {
                label: 'A_bad_group_good_child',
                id: 'A_bad_group_good_child_id',
              },
              {
                label: 'A_bad_group_bad_child',
                id: 'A_bad_group_id',
              },
            ],
          },
        ],
      },
      {
        _id: dictBId,
        name: 'Dictionary B',
        values: [
          {
            label: 'B_root_1',
            id: 'B_root_1_id',
          },
          {
            label: 'B_root_2',
            id: 'B_root_2_id',
          },
          {
            label: 'B good_group',
            id: 'B_good_group_id',
            values: [
              {
                label: 'B_good_group_child_1',
                id: 'B_good_group_child_1_id',
              },
            ],
          },
          {
            label: 'B bad_group',
            id: expect.any(String),
            values: [
              {
                label: 'B_bad_group_good_child',
                id: 'B_bad_group_good_child_id',
              },
              {
                label: 'B_bad_group_bad_child',
                id: 'B_bad_group_id', // same as parent
              },
            ],
          },
        ],
      },
    ]);
    expect(newIdForA).not.toBe('A_bad_group_id');
    expect(newIdForB).not.toBe('B_bad_group_id');
  });

  it('should not touch unrelated entities', async () => {
    const entities = await db
      .collection('entities')
      .find({ template: unrelatedTemplateId })
      .toArray();
    expect(entities).toMatchObject([
      {
        title: 'no_metadata_entity',
        language: 'en',
        mongoLanguage: 'en',
        sharedId: 'no_metadata_entity',
        template: unrelatedTemplateId,
        published: false,
      },
      {
        title: 'empty_entity',
        language: 'en',
        mongoLanguage: 'en',
        sharedId: 'empty_entity',
        template: unrelatedTemplateId,
        published: false,
        metadata: {},
      },
      {
        title: 'unrelated_entity',
        language: 'en',
        mongoLanguage: 'en',
        sharedId: 'unrelated_entity',
        template: unrelatedTemplateId,
        published: false,
        metadata: {
          a_text: [{ value: 'a text value' }],
        },
      },
    ]);
  });

  it('should reindex if there are changes', async () => {
    expect(migration.reindex).toBe(true);
  });

  it('should not reindex if there are no changes', async () => {
    await testingDB.setupFixturesAndContext({});
    migration.reindex = false;
    await migration.up(db);
    expect(migration.reindex).toBe(false);
  });
});
