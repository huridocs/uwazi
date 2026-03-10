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
              key: 'Configure the default landing page for your site.',
              value: 'Configure the default landing page for your site. changed',
            },
            {
              _id: db.id(),
              key: '- Site page:',
              value: '- Site page:',
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
              key: 'Configure the default landing page for your site.',
              value: 'Configurar la pagina de inicio para tu sitio.',
            },
            {
              _id: db.id(),
              key: '- Site page:',
              value: '- Sito:',
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
            {
              _id: db.id(),
              key: 'Configure the default landing page for your site.',
              value: 'Configure the default landing page for your site.',
            },
            {
              _id: db.id(),
              key: '- Site page:',
              value: '- Site page:',
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
