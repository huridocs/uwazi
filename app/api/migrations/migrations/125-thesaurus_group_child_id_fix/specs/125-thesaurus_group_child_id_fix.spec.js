import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import {
  dictAId,
  dictBId,
  fixtures,
  unrelatedTemplateId,
  selectTemplateId,
  multiSelectTemplateId,
  inheritingTemplateId,
} from './fixtures.js';

describe('migration thesaurus_group_child_id_fix', () => {
  let db;
  let dicts;
  let newIdForA;
  let newIdForB;
  let newIdForB2;

  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
    db = testingDB.mongodb;
    migration.reindex = false;
    await migration.up(db);
    dicts = await db.collection('dictionaries').find({}).toArray();
    newIdForA = dicts
      .find(d => d._id.toString() === dictAId.toString())
      .values.find(v => v.label === 'A bad_group').id;
    newIdForB2 = dicts
      .find(d => d._id.toString() === dictBId.toString())
      .values.find(v => v.label === 'B bad_group_2').id;
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
            id: expect.not.stringMatching('A_bad_group_id'),
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
                id: 'B_bad_group_id',
              },
            ],
          },

          {
            label: 'B bad_group_2',
            id: expect.not.stringMatching('B_bad_group_2_id'),
            values: [
              {
                label: 'B_bad_group_2_good_child',
                id: 'B_bad_group_2_good_child_id',
              },
              {
                label: 'B_bad_group_2_bad_child',
                id: 'B_bad_group_2_id',
              },
            ],
          },
        ],
      },
    ]);
    expect(newIdForA).not.toBe('A_bad_group_id');
    expect(newIdForB).not.toBe('B_bad_group_id');
    expect(newIdForB2).not.toBe('B_bad_group_2_id');
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

  it('should fix select metadata', async () => {
    const entities = await db.collection('entities').find({ template: selectTemplateId }).toArray();
    expect(entities).toMatchObject([
      {
        title: 'select_entity',
        language: 'en',
        mongoLanguage: 'en',
        sharedId: 'select_entity',
        template: selectTemplateId,
        published: false,
        metadata: {
          a_select: [
            {
              label: 'A_bad_group_bad_child',
              value: 'A_bad_group_id',
              parent: {
                label: 'A bad_group',
                value: newIdForA,
              },
            },
          ],
          another_text: [{ value: 'another text value' }],
        },
      },
      {
        title: 'select_entity_good',
        language: 'en',
        mongoLanguage: 'en',
        sharedId: 'select_entity_good',
        template: selectTemplateId,
        published: false,
        metadata: {
          a_select: [
            {
              label: 'A_bad_group_good_child',
              value: 'A_bad_group_good_child_id',
              parent: {
                label: 'A bad_group',
                value: newIdForA,
              },
            },
          ],
          another_text: [{ value: 'another text value' }],
        },
      },
    ]);
  });

  it('should fix multiselect metadata', async () => {
    const entities = await db
      .collection('entities')
      .find({ template: multiSelectTemplateId })
      .toArray();
    expect(entities).toMatchObject([
      {
        title: 'multiselect_entity',
        language: 'en',
        mongoLanguage: 'en',
        sharedId: 'multiselect_entity',
        template: multiSelectTemplateId,
        published: false,
        metadata: {
          a_multiselect: [
            {
              label: 'B_root_1',
              value: 'B_root_1_id',
            },
            {
              label: 'B_good_group_child_1',
              value: 'B_good_group_child_1_id',
              parent: {
                label: 'B good_group',
                value: 'B_good_group_id',
              },
            },
            {
              label: 'B_bad_group_good_child',
              value: 'B_bad_group_good_child_id',
              parent: {
                label: 'B bad_group',
                value: newIdForB,
              },
            },
            {
              label: 'B_bad_group_bad_child',
              value: 'B_bad_group_id',
              parent: {
                label: 'B bad_group',
                value: newIdForB,
              },
            },
          ],
          a_number: [{ value: 0 }],
        },
      },
    ]);
  });

  it('should fix inherited metadata', async () => {
    const entities = await db
      .collection('entities')
      .find({ template: inheritingTemplateId })
      .toArray();
    expect(entities).toMatchObject([
      {
        title: 'inheriting_entity',
        language: 'en',
        mongoLanguage: 'en',
        sharedId: 'inheriting_entity',
        template: inheritingTemplateId,
        published: false,
        metadata: {
          inherited_select: [
            {
              value: 'some_sharedId_A',
              label: 'some title A',
              type: 'entity',
              inheritedType: 'select',
              inheritedValue: [
                {
                  label: 'A_bad_group_bad_child',
                  value: 'A_bad_group_id',
                  parent: {
                    label: 'A bad_group',
                    value: newIdForA,
                  },
                },
              ],
            },
            {
              value: 'some_sharedId_B',
              label: 'some title B',
              type: 'entity',
              inheritedType: 'select',
              inheritedValue: [
                {
                  label: 'A_bad_group_good_child',
                  value: 'A_bad_group_good_child_id',
                  parent: {
                    label: 'A bad_group',
                    value: newIdForA,
                  },
                },
              ],
            },
          ],
          inherited_multiselect: [
            {
              value: 'some_sharedId_C',
              label: 'some title C',
              type: 'entity',
              inheritedType: 'multiselect',
              inheritedValue: [
                {
                  label: 'B_bad_group_bad_child',
                  value: 'B_bad_group_id',
                  parent: {
                    label: 'B bad_group',
                    value: newIdForB,
                  },
                },
              ],
            },
            {
              value: 'some_sharedId_D',
              label: 'some title D',
              type: 'entity',
              inheritedType: 'multiselect',
              inheritedValue: [
                {
                  label: 'B_root_1',
                  value: 'B_root_1_id',
                },
                {
                  label: 'B_good_group_child_1',
                  value: 'B_good_group_child_1_id',
                  parent: {
                    label: 'B good_group',
                    value: 'B_good_group_id',
                  },
                },
                {
                  label: 'B_bad_group_good_child',
                  value: 'B_bad_group_good_child_id',
                  parent: {
                    label: 'B bad_group',
                    value: newIdForB,
                  },
                },
                {
                  label: 'B_bad_group_2_bad_child',
                  value: 'B_bad_group_2_id',
                  parent: {
                    label: 'B bad_group_2',
                    value: newIdForB2,
                  },
                },
              ],
            },
          ],
          another_number: [{ value: 0 }],
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
