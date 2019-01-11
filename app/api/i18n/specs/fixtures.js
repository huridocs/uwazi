import db from 'api/utils/testing_db';

const entityTemplateId = db.id();
const documentTemplateId = db.id();
const englishTranslation = db.id();
export default {
  translations: [
    {
      _id: englishTranslation,
      locale: 'en',
      contexts: [
        {
          _id: db.id(),
          id: 'System',
          label: 'System',
          values: [
            { key: 'Password', value: 'Password' },
            { key: 'Account', value: 'Account' },
            { key: 'Email', value: 'E-Mail' },
            { key: 'Age', value: 'Age' }
          ]
        },
        {
          _id: db.id(),
          id: 'Filters',
          label: 'Filters'
        },
        {
          _id: db.id(),
          id: 'Menu',
          label: 'Menu'
        },
        {
          _id: db.id(),
          id: entityTemplateId.toString(),
          label: 'Judge',
          values: [],
          type: 'Entity'
        },
        {
          _id: db.id(),
          id: documentTemplateId.toString(),
          label: 'Court order',
          values: [],
          type: 'Document'
        }
      ]
    },
    {
      _id: db.id(),
      type: 'translation',
      locale: 'es',
      contexts: [
        {
          id: 'System',
          label: 'System',
          values: [
            { key: 'Password', value: 'Contraseña' },
            { key: 'Account', value: 'Cuenta' },
            { key: 'Email', value: 'Correo electronico' },
            { key: 'Age', value: 'Edad' }
          ]
        }
      ]
    },
    {
      _id: db.id(),
      type: 'translation',
      locale: 'other',
      contexts: []
    }
  ],
  settings: [
    {
      _id: db.id(),
      languages: [
        {
          key: 'es',
          label: 'Español'
        },
        {
          key: 'en',
          label: 'English',
          default: true
        }
      ]
    }
  ],
  templates: [
    {
      _id: entityTemplateId,
      type: 'template'
    },
    {
      _id: documentTemplateId,
      type: 'template'
    }
  ]
};

export {
  entityTemplateId,
  englishTranslation,
  documentTemplateId
};
