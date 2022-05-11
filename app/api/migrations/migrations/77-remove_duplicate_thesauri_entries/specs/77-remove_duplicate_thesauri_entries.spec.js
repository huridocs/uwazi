import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

const expectedSelect = [{ value: 'C_3_id', label: 'C__(3)' }];

const expectedMultiSelect = [
  { value: 'A_2_id', label: 'A__(2)' },
  { value: 'B', label: 'B_id' },
  { label: 'C', id: 'C_id' },
  { label: 'C__(2)', id: 'C_2_id' },
  { label: 'C__(3)', id: 'C_3_id' },
  { value: 'group_B_id', label: 'B', parent: { value: 'group_1_id', label: 'group_1' } },
  { value: 'group_A_id', label: 'A', parent: { value: 'group_1_id', label: 'group_1' } },
  { value: 'group_A_2_id', label: 'A__(2)', parent: { value: 'group_1_id', label: 'group_1' } },
  { value: 'group_D_id', label: 'D', parent: { value: 'A_group_id', label: 'A__(3)' } },
];

describe('migration remove_duplicate_thesauri_entries', () => {
  let savedThesaurus;

  beforeEach(async () => {
    // spyOn(process.stdout, 'write');
    await testingDB.clearAllAndLoad(fixtures);
    migration.reindex = undefined;
    await migration.up();
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(77);
  });

  it('should rename label repetitions', async () => {
    const expectedDictValues = [
      { label: 'A', id: 'A_id' },
      { label: 'B', id: 'B_id' },
      { label: 'A__(2)', id: 'A_2_id' },
      {
        label: 'group_1',
        id: 'group_1_id',
        values: [
          { label: 'A', id: 'group_A_id' },
          { label: 'B', id: 'group_B_id' },
          { label: 'A__(2)', id: 'group_A_2_id' },
        ],
      },
      { label: 'C', id: 'C_id' },
      { label: 'C__(2)', id: 'C_2_id' },
      { label: 'C__(3)', id: 'C_3_id' },
      {
        label: 'A__(3)',
        id: 'A_group_id',
        values: [{ label: 'D', id: 'group_D_id' }],
      },
    ];
    const thesaurus = await testingDB.mongodb
      .collection('dictionaries')
      .findOne({ name: 'test_thesaurus' });
    expect(thesaurus.values).toMatchObject(expectedDictValues);
  });

  it.each([
    { property: 'select', title: 'root_entity', expected: expectedSelect },
    { property: 'multi_select', title: 'root_entity', expected: expectedMultiSelect },
  ])(
    'should denormalize changed $case entity properties',
    async ({ property, title, expected }) => {
      const entity = await testingDB.mongodb.collection('entities').findOne({ title });
      expect(entity.metadata[property]).toMatchObject(expected);
    }
  );

  it.each([
    { property: 'inherited_select', title: 'inheriting entity', expected: expectedSelect },
    {
      property: 'inherited_multiselect',
      title: 'inheriting entity',
      expected: expectedMultiSelect,
    },
  ])(
    'should denormalize changed $case entity properties',
    async ({ property, title, expected }) => {
      const entity = await testingDB.mongodb.collection('entities').findOne({ title });
      expect(entity.metadata[property][0].inheritedValue).toMatchObject(expected);
    }
  );

  it('should reindex if there were change', async () => {
    expect(migration.reindex).toBe(true);
  });

  it('should reindex if there were no changes', async () => {
    await testingDB.clearAllAndLoad({});
    await migration.up();
    expect(migration.reindex).toBe(false);
  });
});
