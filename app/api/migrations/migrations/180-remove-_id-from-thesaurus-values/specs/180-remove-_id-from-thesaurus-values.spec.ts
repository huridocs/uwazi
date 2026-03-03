import testingDB from '#api/utils/testing_db.js';
import migration from '../index.js';
import { fixtures, ids } from './fixtures.js';

describe('Remove _id from thesaurus values', () => {
  const getThesaurus = async () => testingDB.mongodb!.collection('dictionaries').find().toArray();

  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation((_str: string | Uint8Array) => true);
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await testingDB.clearAllAndLoadFixtures(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(180);
  });

  it('should remove _id from thesaurus values', async () => {
    await migration.up(testingDB.mongodb!);

    const thesaurus = await getThesaurus();

    expect(thesaurus).toEqual([
      {
        _id: ids.thesaurus_1,
        name: 'Thesaurus 1',
        values: [
          {
            id: 'id_1',
            label: 'Label',
          },
          {
            id: 'id_2',
            label: 'Label',
          },
          {
            id: 'id_3',
            label: 'Label',
          },

          {
            id: 'id_4',
            label: 'Label',
            values: [
              {
                id: 'id_5',
                label: 'Label',
              },

              {
                id: 'id_6',
                label: 'Label',
              },
            ],
          },

          {
            id: 'id_7',
            label: 'Label',
            values: [
              {
                id: 'id_8',
                label: 'Label',
              },
            ],
          },
        ],
      },

      {
        _id: ids.thesaurus_2,
        name: 'Thesaurus 2',
        values: [
          {
            id: 'id_5',
            label: 'Label',
          },
        ],
      },

      {
        _id: ids.thesaurus_3,
        name: 'Thesaurus 3',
        values: [
          {
            id: 'id_6',
            label: 'Label',
          },
        ],
      },

      {
        _id: ids.thesaurus_4,
        name: 'Empty values array',
        values: [],
      },

      {
        _id: ids.thesaurus_5,
        name: 'Only nested _id',
        values: [
          {
            id: 'id_10',
            label: 'No _id at top',
            values: [
              {
                id: 'id_11',
                label: 'Has _id in nested',
              },
            ],
          },
        ],
      },

      {
        _id: ids.thesaurus_6,
        name: 'No values property',
      },

      {
        _id: ids.thesaurus_7,
        name: 'Parent with _id and empty nested values',
        values: [
          {
            id: 'id_12',
            label: 'Has _id but empty nested',
            values: [],
          },
        ],
      },
    ]);
  });

  it('should be idempotent', async () => {
    await migration.up(testingDB.mongodb!);
    await migration.up(testingDB.mongodb!);
    await migration.up(testingDB.mongodb!);

    const thesaurus = await getThesaurus();

    expect(thesaurus).toEqual([
      {
        _id: ids.thesaurus_1,
        name: 'Thesaurus 1',
        values: [
          {
            id: 'id_1',
            label: 'Label',
          },
          {
            id: 'id_2',
            label: 'Label',
          },
          {
            id: 'id_3',
            label: 'Label',
          },

          {
            id: 'id_4',
            label: 'Label',
            values: [
              {
                id: 'id_5',
                label: 'Label',
              },

              {
                id: 'id_6',
                label: 'Label',
              },
            ],
          },

          {
            id: 'id_7',
            label: 'Label',
            values: [
              {
                id: 'id_8',
                label: 'Label',
              },
            ],
          },
        ],
      },

      {
        _id: ids.thesaurus_2,
        name: 'Thesaurus 2',
        values: [
          {
            id: 'id_5',
            label: 'Label',
          },
        ],
      },

      {
        _id: ids.thesaurus_3,
        name: 'Thesaurus 3',
        values: [
          {
            id: 'id_6',
            label: 'Label',
          },
        ],
      },

      {
        _id: ids.thesaurus_4,
        name: 'Empty values array',
        values: [],
      },

      {
        _id: ids.thesaurus_5,
        name: 'Only nested _id',
        values: [
          {
            id: 'id_10',
            label: 'No _id at top',
            values: [
              {
                id: 'id_11',
                label: 'Has _id in nested',
              },
            ],
          },
        ],
      },

      {
        _id: ids.thesaurus_6,
        name: 'No values property',
      },

      {
        _id: ids.thesaurus_7,
        name: 'Parent with _id and empty nested values',
        values: [
          {
            id: 'id_12',
            label: 'Has _id but empty nested',
            values: [],
          },
        ],
      },
    ]);
  });
});
