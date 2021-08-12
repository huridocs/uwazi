import db from 'api/utils/testing_db';

export const templateId = db.id();

//system context
const commonContext = {
  id: 'System',
  label: 'User Interface',
  type: 'Uwazi UI',
  values: [
    {
      key: 'existing-key-in-system',
      value: 'existing-key-in-system',
    },
  ],
};

export default {
  entities: [{ title: 'test_doc' }],
  translations: [
    {
      _id: db.id(),
      locale: 'es',
      contexts: [
        {
          ...commonContext,
          values: commonContext.values.concat([
            { key: 'Upload PDF', value: 'Subir PDF' },
            { key: 'Two-step verification', value: 'Verificación en dos pasos' },
          ]),
        },
      ],
    },
    {
      _id: db.id(),
      locale: 'en',
      contexts: [
        {
          ...commonContext,
          values: commonContext.values.concat([{ key: 'Upload PDF', value: 'Upload PDF' }]),
        },
      ],
    },
    {
      _id: db.id(),
      locale: 'hu',
      contexts: [
        {
          ...commonContext,
          values: commonContext.values.concat([
            { key: 'Unpublish', value: 'Visszavonás' },
            { key: 'Upload PDF', value: 'PDF Feltöltése' },
          ]),
        },
      ],
    },
  ],
};
