/* eslint-disable max-lines */
import db from 'api/utils/testing_db';

const entity1SharedId = db.id();
const entity2SharedId = db.id();
const entity3SharedId = db.id();
const entity4SharedId = db.id();
const thesaurus1Id = db.id();
const thesaurus2Id = db.id();

const fixtures = {
  entities: [
    {
      _id: db.id(),
      title: 'Entity 1',
      language: 'en',
      sharedId: entity1SharedId,
      metadata: {
        multi_select: [
          {
            value: 'km5ew66zj2',
            label: 'English value one',
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
      metadata: {
        multi_select: [
          {
            value: 'km5ew66zj2',
            label: 'English value one',
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
      metadata: {
        multi_select: [
          {
            value: 's9emfh4f2sn',
            label: 'Value that is not translated',
          },
        ],
        text: [
          {
            value: 'entity text value',
          },
        ],
      },
    },
    {
      _id: db.id(),
      title: 'Entity 2',
      language: 'es',
      sharedId: entity2SharedId,
      metadata: {
        multi_select: [
          {
            value: 's9emfh4f2sn',
            label: 'Value that is not translated',
          },
        ],
        text: [
          {
            value: 'entity text value',
          },
        ],
      },
    },
    {
      _id: db.id(),
      title: 'Entity 3',
      language: 'en',
      sharedId: entity3SharedId,
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
      metadata: {
        text: [
          {
            value: 'this entity only has text values',
          },
        ],
      },
    },
    {
      _id: db.id(),
      title: 'Entity 4',
      language: 'es',
      sharedId: entity4SharedId,
      metadata: {
        text: [
          {
            value: 'esta entidad solo tiene un texto',
          },
        ],
      },
    },
  ],
  dicctionary: [
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
          id: thesaurus1Id,
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
          ],
        },
        {
          _id: db.id(),
          id: thesaurus2Id,
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
          id: thesaurus1Id,
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
          ],
        },
        {
          _id: db.id(),
          id: thesaurus2Id,
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
          locale: 'es',
          contexts: [
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
    },
  ],
};

export { fixtures, entity1SharedId, entity2SharedId, entity3SharedId, entity4SharedId };
