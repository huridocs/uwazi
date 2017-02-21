import {db} from 'api/utils';
const entityTemplateId = db.id();
const documentTemplateId = db.id();
export default {
  translations: [
    {
      _id: db.id(),
      locale: 'en',
      contexts: [
        {
          id: 'System',
          label: 'System',
          values: {
            Password: 'Password',
            Account: 'Account',
            Email: 'E-Mail',
            Age: 'Age'
          }
        },
        {
          id: 'Filters',
          label: 'Filters'
        },
        {
          id: 'Menu',
          label: 'Menu'
        },
        {
          id: entityTemplateId.toString(),
          label: 'Judge',
          values: {},
          type: 'Entity'
        },
        {
          id: documentTemplateId.toString(),
          label: 'Court order',
          values: {},
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
          values: {
            Password: 'Contraseña',
            Account: 'Cuenta',
            Email: 'Correo electronico',
            Age: 'Edad'
          }
        }
      ]
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
      type: 'template',
      isEntity: true
    },
    {
      _id: documentTemplateId,
      type: 'template',
      isEntity: false
    }
  ]
};

export {
  entityTemplateId,
  documentTemplateId
};
