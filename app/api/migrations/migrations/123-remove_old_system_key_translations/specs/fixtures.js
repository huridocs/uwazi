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
              key: 'Can not delete template:',
              value: 'Can not delete template: changed',
            },
            {
              _id: db.id(),
              key: 'Browse your PDFs to upload',
              value: 'Browse your PDFs to upload',
            },
            {
              _id: db.id(),
              key: 'For better performance, upload your files in batches of 50 or less.',
              value: 'For better performance, upload your files in batches of 50 or less.',
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
              key: 'Browse your PDFs to upload',
              value: 'Selecciona tus PDFs para cargarlos',
            },
            {
              _id: db.id(),
              key: 'For better performance, upload your files in batches of 50 or less.',
              value: 'Para mejor rendimiendo, sube tus archivos en grupos de 50 o menos',
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
