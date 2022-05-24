import db from 'api/utils/testing_db';

const template1Id = db.id();
const template2Id = db.id();

export const fixtures = {
  templates: [
    {
      _id: template1Id,
      name: 'new template name',
      properties: [{ _id: db.id(), type: 'text', name: 'text' }],
    },
    {
      _id: template2Id,
      name: 'new template name 2',
      properties: [],
    },
  ],
  translations: [
    {
      _id: db.id(),
      locale: 'en',
      contexts: [
        {
          _id: db.id(),
          id: template1Id.toString(),
          label: 'old template name',
          values: [
            {
              _id: db.id(),
              key: 'text',
              value: 'text',
            },
            {
              _id: db.id(),
              key: 'old template name',
              value: 'translation template name',
            },
          ],
          type: 'Entity',
        },
        {
          _id: db.id(),
          label: 'old template name 2',
          id: template2Id.toString(),
          values: [
            {
              _id: db.id(),
              key: 'old template name 2',
              value: 'translation template name 2',
            },
          ],
          type: 'Entity',
        },
      ],
    },
    {
      _id: db.id(),
      locale: 'es',
      contexts: [
        {
          _id: db.id(),
          id: template1Id.toString(),
          label: 'old template name',
          values: [
            {
              _id: db.id(),
              key: 'text',
              value: 'text',
            },
            {
              _id: db.id(),
              key: 'old template name',
              value: 'traduccion template name',
            },
          ],
          type: 'Entity',
        },
        {
          _id: db.id(),
          id: template2Id.toString(),
          label: 'old template name 2',
          values: [
            {
              _id: db.id(),
              key: 'old template name 2',
              value: 'traduccion template name 2',
            },
          ],
          type: 'Entity',
        },
      ],
    },
  ],
};
