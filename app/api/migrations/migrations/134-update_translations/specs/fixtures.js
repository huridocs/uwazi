import db from 'api/utils/testing_db';

const templateContext = {
  id: db.id(),
  label: 'default template',
  type: 'Entity',
  values: [
    {
      key: 'default template',
      value: 'default template',
    },
    {
      key: 'Title',
      value: 'Title',
    },
  ],
};

const fixturesDB = {
  translations: [
    {
      _id: db.id(),
      locale: 'en',
      contexts: [
        {
          _id: db.id(),
          type: 'Uwazi UI',
          label: 'User Interface',
          id: 'System',
          values: [
            {
              key: 'existing-key-in-system',
              value: 'existing-key-in-system',
            },
            {
              _id: db.id(),
              key: 'Available Languages',
              value: 'Available Languages',
            },
          ],
        },
        templateContext,
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
          id: 'System',
          values: [
            {
              key: 'existing-key-in-system',
              value: 'existing-key-in-system',
            },
            {
              _id: db.id(),
              key: 'Available Languages',
              value: 'Available Languages',
            },
          ],
        },
        templateContext,
      ],
    },
    {
      _id: db.id(),
      locale: 'pt',
      contexts: [
        {
          _id: db.id(),
          type: 'Uwazi UI',
          label: 'User Interface',
          id: 'System',
          values: [
            {
              key: 'existing-key-in-system',
              value: 'existing-key-in-system',
            },
          ],
        },
        templateContext,
      ],
    },
  ],
};

export { templateContext };
export default fixturesDB;
