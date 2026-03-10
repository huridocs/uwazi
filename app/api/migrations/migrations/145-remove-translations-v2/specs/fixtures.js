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

const translations = [
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
            key: 'New password',
            value: 'New password',
          },
          {
            key: 'Confirm New Passowrd',
            value: 'Confirm New Passowrd',
          },
          {
            key: 'New Password',
            value: 'New Password',
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
            key: 'New password',
            value: 'New password',
          },
          {
            key: 'Confirm New Passowrd',
            value: 'Confirm New Passowrd',
          },
          {
            key: 'New Password',
            value: 'New Password',
          },
        ],
      },
      templateContext,
    ],
  },
];

const translationsV2 = [
  {
    _id: db.id(),
    language: 'en',
    key: 'Confirm New Passowrd',
    value: 'Confirm New Passowrd',
    context: {
      type: 'Uwazi UI',
      label: 'User Interface',
      id: 'System',
    },
  },
  {
    _id: db.id(),
    language: 'es',
    key: 'Confirm New Passowrd',
    value: 'Confirmar Nueva Contraseña',
    context: {
      type: 'Uwazi UI',
      label: 'User Interface',
      id: 'System',
    },
  },
  {
    _id: db.id(),
    language: 'en',
    key: 'Library',
    value: 'Library',
    context: {
      type: 'Uwazi UI',
      label: 'User Interface',
      id: 'System',
    },
  },
  {
    _id: db.id(),
    language: 'es',
    key: 'Library',
    value: 'Biblioteca',
    context: {
      type: 'Uwazi UI',
      label: 'User Interface',
      id: 'System',
    },
  },
  {
    _id: db.id(),
    language: 'en',
    key: 'New Password',
    value: 'New Password',
    context: {
      type: 'Uwazi UI',
      label: 'User Interface',
      id: 'System',
    },
  },
  {
    _id: db.id(),
    language: 'es',
    key: 'New Password',
    value: 'Nueva contraseña',
    context: {
      type: 'Uwazi UI',
      label: 'User Interface',
      id: 'System',
    },
  },
  {
    _id: db.id(),
    language: 'en',
    key: 'New password',
    value: 'New password',
    context: {
      type: 'Uwazi UI',
      label: 'User Interface',
      id: 'System',
    },
  },
  {
    _id: db.id(),
    language: 'es',
    key: 'New password',
    value: 'Nueva contraseña',
    context: {
      type: 'Uwazi UI',
      label: 'User Interface',
      id: 'System',
    },
  },
];

export { translations, translationsV2, templateContext };
