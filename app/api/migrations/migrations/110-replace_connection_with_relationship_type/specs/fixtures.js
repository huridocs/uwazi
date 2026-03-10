import db from 'api/utils/testing_db';

export default {
  translations: [
    {
      _id: db.id(),
      locale: 'en',
      contexts: [
        {
          _id: db.id(),
          type: 'Uwazi UI',
          label: 'User Interface',
          id: 'Uwazi UI',
          values: [
            {
              _id: db.id(),
              key: 'Search',
              value: 'Search',
            },
          ],
        },
        {
          _id: db.id(),
          type: 'Connection',
          label: 'Related',
          id: 'relationship_type_1',
          values: [
            {
              _id: db.id(),
              key: 'Related',
              value: 'Related',
            },
          ],
        },
        {
          _id: db.id(),
          type: 'Connection',
          label: 'Inherited',
          id: 'relationship_type_2',
          values: [
            {
              _id: db.id(),
              key: 'Inherited',
              value: 'Inherited',
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
          type: 'Uwazi UI',
          label: 'User Interface',
          id: 'Uwazi UI',
          values: [
            {
              _id: db.id(),
              key: 'Search',
              value: 'Buscar',
            },
          ],
        },
        {
          _id: db.id(),
          type: 'Connection',
          label: 'Related',
          id: 'relationship_type_1',
          values: [
            {
              _id: db.id(),
              key: 'Related',
              value: 'Relacionado',
            },
          ],
        },
        {
          _id: db.id(),
          type: 'Connection',
          label: 'Inherited',
          id: 'relationship_type_2',
          values: [
            {
              _id: db.id(),
              key: 'Inherited',
              value: 'Heredado',
            },
          ],
        },
      ],
    },
  ],
};
