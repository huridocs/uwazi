import db from '#api/utils/testing_db.js';
import { Fixture } from '../types.js';

const ids = {
  thesaurus_1: db.id(),
  thesaurus_1_value_1: db.id(),
  thesaurus_1_value_3: db.id(),
  thesaurus_1_value_7: db.id(),
  thesaurus_1_value_8: db.id(),
  thesaurus_1_value_9: db.id(),

  thesaurus_2: db.id(),
  thesaurus_2_value_1: db.id(),

  thesaurus_3: db.id(),

  thesaurus_4: db.id(),

  thesaurus_5: db.id(),
  thesaurus_5_nested: db.id(),

  thesaurus_6: db.id(),

  thesaurus_7: db.id(),
  thesaurus_7_value_1: db.id(),
};

const fixtures: Fixture = {
  dictionaries: [
    {
      _id: ids.thesaurus_1,
      name: 'Thesaurus 1',
      values: [
        {
          _id: ids.thesaurus_1_value_1,
          id: 'id_1',
          label: 'Label',
        },
        {
          id: 'id_2',
          label: 'Label',
        },
        {
          _id: ids.thesaurus_1_value_3,
          id: 'id_3',
          label: 'Label',
        },

        {
          id: 'id_4',
          label: 'Label',
          values: [
            {
              _id: ids.thesaurus_1_value_7,
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
          _id: ids.thesaurus_1_value_8,
          id: 'id_7',
          label: 'Label',
          values: [
            {
              _id: ids.thesaurus_1_value_9,
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
          _id: ids.thesaurus_2_value_1,
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
              _id: ids.thesaurus_5_nested,
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
    } as any,

    {
      _id: ids.thesaurus_7,
      name: 'Parent with _id and empty nested values',
      values: [
        {
          _id: ids.thesaurus_7_value_1,
          id: 'id_12',
          label: 'Has _id but empty nested',
          values: [],
        },
      ],
    },
  ],
};

export { fixtures, ids };
