/* eslint-disable max-lines */
import db from 'api/utils/testing_db';

const template1Id = db.id();
const template2Id = db.id();
const entity1SharedId = db.id();
const entity2SharedId = db.id();
const entity3SharedId = db.id();
const entity4SharedId = db.id();
const entity5SharedId = db.id();
const thesaurus1Id = db.id();
const thesaurus2Id = db.id();

const fixtures = {
  templates: [
    {
      _id: template1Id,
      name: 'Template 1',
      properties: [
        {
          _id: db.id(),
          label: 'Multi Select',
          type: 'multiselect',
          name: 'multi_select',
          content: thesaurus1Id.toString(),
        },
        {
          _id: db.id(),
          label: 'Text',
          type: 'text',
          name: 'text',
        },
      ],
    },
    {
      _id: template2Id,
      name: 'Template 2',
      properties: [
        {
          _id: db.id(),
          label: 'Select',
          type: 'select',
          name: 'select',
          content: thesaurus1Id.toString(),
        },
      ],
    },
  ],
  entities: [
    {
      _id: db.id(),
      title: 'Entity 1',
      language: 'en',
      sharedId: entity1SharedId,
      template: template1Id,
      metadata: {
        multi_select: [
          {
            value: 'km5ew66zj2',
            label: 'English value one',
          },
          {
            value: 'qhezokoxwgl',
            label: 'English value two',
          },
        ],
        text: [
          {
            value: 'some text value',
          },
        ],
      },
    },
    {
      _id: db.id(),
      title: 'Entity 1',
      language: 'es',
      sharedId: entity1SharedId,
      template: template1Id,
      metadata: {
        multi_select: [
          {
            value: 'km5ew66zj2',
            label: 'English value one',
          },
          {
            value: 'qhezokoxwgl',
            label: 'English value two',
          },
        ],
        text: [
          {
            value: 'un valor de texto',
          },
        ],
      },
    },
    {
      _id: db.id(),
      title: 'Entity 2',
      language: 'en',
      sharedId: entity2SharedId,
      template: template2Id,
      metadata: {
        select: [
          {
            value: 's9emfh4f2sn',
            label: 'Value that is not translated',
          },
        ],
      },
    },
    {
      _id: db.id(),
      title: 'Entity 2',
      language: 'es',
      sharedId: entity2SharedId,
      template: template2Id,
      metadata: {
        select: [
          {
            value: 's9emfh4f2sn',
            label: 'Value that is not translated',
          },
        ],
      },
    },
    {
      _id: db.id(),
      title: 'Entity 3',
      language: 'en',
      sharedId: entity3SharedId,
      template: template1Id,
      metadata: {
        multi_select: [
          {
            value: 'qhezokoxwgl',
            label: 'English value two',
          },
        ],
        text: [
          {
            value: 'another text value',
          },
        ],
      },
    },
    {
      _id: db.id(),
      title: 'Entity 3',
      language: 'es',
      sharedId: entity3SharedId,
      template: template1Id,
      metadata: {
        multi_select: [
          {
            value: 'qhezokoxwgl',
            label: 'English value two',
          },
        ],
        text: [
          {
            value: 'más texto',
          },
        ],
      },
    },
    {
      _id: db.id(),
      title: 'Entity 4',
      language: 'en',
      sharedId: entity4SharedId,
      template: template1Id,
      metadata: {
        text: [
          {
            value: 'this entity only has text values',
          },
        ],
        multi_select: [],
      },
    },
    {
      _id: db.id(),
      title: 'Entity 4',
      language: 'es',
      sharedId: entity4SharedId,
      template: template1Id,
      metadata: {
        text: [
          {
            value: 'esta entidad solo tiene un texto',
          },
        ],
        multi_select: [],
      },
    },
    {
      _id: db.id(),
      title: 'Entity 5',
      language: 'en',
      sharedId: entity5SharedId,
      template: template2Id,
      metadata: {
        select: [
          {
            value: 'oxd117w0bf',
            label: 'Nested item 1',
            parent: {
              value: 'x5q2yo64gmk',
              label: 'Nested',
            },
          },
        ],
      },
    },
    {
      _id: db.id(),
      title: 'Entity 5',
      language: 'es',
      sharedId: entity5SharedId,
      template: template2Id,
      metadata: {
        select: [
          {
            value: 'oxd117w0bf',
            label: 'Nested item 1',
            parent: {
              value: 'x5q2yo64gmk',
              label: 'Nested',
            },
          },
        ],
      },
    },
  ],
  dictionaries: [
    {
      _id: thesaurus1Id,
      name: 'Thesaurus1',
      values: [
        {
          label: 'English value one',
          id: 'km5ew66zj2',
        },
        {
          label: 'Value that is not translated',
          id: 's9emfh4f2sn',
        },
        {
          label: 'English value two',
          id: 'qhezokoxwgl',
        },
        {
          label: 'Nested',
          id: 'x5q2yo64gmk',
          values: [
            {
              label: 'Nested item 1',
              id: 'oxd117w0bf',
            },
            {
              label: 'Nested item 2',
              id: 'd0bx3u2ddc9',
            },
          ],
        },
      ],
    },
    {
      _id: thesaurus2Id,
      name: 'Thesaurus2',
      values: [
        {
          label: 'Unused',
          id: '3h3uq6cn91g',
        },
      ],
    },
  ],
  translations: [
    {
      _id: db.id(),
      locale: 'en',
      contexts: [
        {
          _id: db.id(),
          id: thesaurus1Id.toString(),
          label: 'Thesaurus1',
          type: 'Thesaurus',
          values: [
            {
              _id: db.id(),
              key: 'English value one',
              value: 'This value was translated in english to change the way it displays',
            },
            {
              _id: db.id(),
              key: 'Value that is not translated',
              value: 'Value that is not translated',
            },
            {
              _id: db.id(),
              key: 'English value two',
              value: 'English value two',
            },
            {
              _id: db.id(),
              key: 'Thesaurus1',
              value: 'Thesaurus1',
            },
            {
              _id: db.id(),
              key: 'Nested',
              value: 'Nested',
            },
            {
              _id: db.id(),
              key: 'Nested item 1',
              value: 'Nested item 1',
            },
            {
              _id: db.id(),
              key: 'Nested item 2',
              value: 'Nested item 2',
            },
          ],
        },
        {
          _id: db.id(),
          id: thesaurus2Id.toString(),
          label: 'Thesaurus2',
          type: 'Thesaurus',
          values: [
            {
              _id: db.id(),
              key: 'Unused',
              value: 'Unused',
            },
            {
              _id: db.id(),
              key: 'Thesaurus2',
              value: 'Thesaurus2',
            },
          ],
        },
        {
          _id: db.id(),
          id: 'System',
          label: 'User Interface',
          type: 'Uwazi UI',
          values: [
            {
              _id: db.id(),
              key: 'Search',
              value: 'Search',
            },
          ],
        },
      ],
    },
    {
      _id: db.id(),
      locale: 'es',
      contexts: [
        {
          _id: db.id(),
          id: thesaurus1Id.toString(),
          label: 'Thesaurus1',
          type: 'Thesaurus',
          values: [
            {
              _id: db.id(),
              key: 'English value one',
              value: 'Valor uno en español',
            },
            {
              _id: db.id(),
              key: 'Value that is not translated',
              value: 'Value that is not translated',
            },
            {
              _id: db.id(),
              key: 'English value two',
              value: 'Valor dos en español',
            },
            {
              _id: db.id(),
              key: 'Thesaurus1',
              value: 'Diccionario1',
            },
            {
              _id: db.id(),
              key: 'Nested',
              value: 'Agrupados',
            },
            {
              _id: db.id(),
              key: 'Nested item 1',
              value: 'Item agrupado 1',
            },
            {
              _id: db.id(),
              key: 'Nested item 2',
              value: 'Nested item 2',
            },
          ],
        },
        {
          _id: db.id(),
          id: thesaurus2Id.toString(),
          label: 'Thesaurus2',
          type: 'Thesaurus',
          values: [
            {
              _id: db.id(),
              key: 'Unused',
              value: 'Unused',
            },
            {
              _id: db.id(),
              key: 'Thesaurus2',
              value: 'Thesaurus2',
            },
          ],
        },
        {
          _id: db.id(),
          id: 'System',
          label: 'User Interface',
          type: 'Uwazi UI',
          values: [
            {
              _id: db.id(),
              key: 'Search',
              value: 'Buscar',
            },
          ],
        },
      ],
    },
  ],
};

export { fixtures, entity1SharedId, entity2SharedId, entity3SharedId, entity4SharedId };
