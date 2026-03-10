import { Db } from 'mongodb';

import testingDB from 'api/utils/testing_db';
import migration from '../index';
import { fixtures } from './fixtures';
import { CorrectLink, CorrectSimpleLink, Settings } from '../types';

let db: Db | null;

const expectedCorrectLinks: CorrectSimpleLink[] = [
  {
    title: 'missing_type',
    type: 'link',
    url: 'an url',
  },
  {
    title: 'extra_local_Id',
    type: 'link',
    url: 'an url',
  },
  {
    title: 'extra_sublinks',
    type: 'link',
    url: 'an url',
  },
  {
    title: 'bad_type',
    type: 'link',
    url: 'an url',
  },
];

beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  jest.spyOn(process.stdout, 'write').mockImplementation((str: string | Uint8Array) => true);
  // @ts-ignore - intentionally wrong fixtures for testing
  await testingDB.setupFixturesAndContext(fixtures);
  db = testingDB.mongodb!;
  await migration.up(db);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration update_settings_link_structure', () => {
  it('should have a delta number', () => {
    expect(migration.delta).toBe(153);
  });

  it('should repair or remove faulty links as needed', async () => {
    const expected: CorrectLink[] = [
      {
        title: 'correct_root_link',
        type: 'link',
        url: 'correct_root_link_url',
      },
      {
        title: 'correct_root_group',
        type: 'group',
        url: '',
        sublinks: [
          {
            title: 'correct_sublink',
            type: 'link',
            url: 'correct_sublink_url',
          },
        ],
      },
      ...expectedCorrectLinks,
      {
        title: 'correct_group_with_faulty_sublinks',
        type: 'group',
        url: '',
        sublinks: expectedCorrectLinks,
      },
      {
        title: 'group_with_extra_localId_and_faulty_sublinks',
        type: 'group',
        url: '',
        sublinks: expectedCorrectLinks,
      },
      {
        title: 'missing_type',
        type: 'group',
        url: '',
        sublinks: [],
      },
      {
        title: 'missing_url',
        type: 'group',
        url: '',
        sublinks: [],
      },
      {
        title: 'extra_local_Id',
        type: 'group',
        url: '',
        sublinks: [],
      },
      {
        title: 'missing sublinks',
        type: 'group',
        url: '',
        sublinks: [],
      },
      {
        title: 'group_with_bad_type',
        type: 'group',
        url: '',
        sublinks: [],
      },
    ];
    const inDb = (await db!.collection<Settings>('settings').find({}).toArray())[0].links;
    expect(inDb).toEqual(expected);
  });

  it('should not reindex', async () => {
    expect(migration.reindex).toBe(false);
  });
});
