import db from 'api/utils/testing_db';

export const templateId = db.id();
export const defaultTemplateName = 'default template';
export const defaultTemplateTitle = 'Title';

//contexts
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
const templateContext = {
  id: templateId.toString(),
  label: defaultTemplateName,
  type: 'Entity',
  values: [
    {
      key: defaultTemplateName,
      value: defaultTemplateName,
    },
    {
      key: defaultTemplateTitle,
      value: defaultTemplateTitle,
    },
  ],
};

export default {
  templates: [
    //default template name - correct
    {
      _id: templateId,
      name: defaultTemplateName,
      commonProperties: [{ name: 'title', label: defaultTemplateTitle, type: 'text' }],
      properties: [],
    },
  ],
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
        templateContext,
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
        templateContext,
      ],
    },
    {
      _id: db.id(),
      locale: 'hu',
      contexts: [
        {
          ...commonContext,
          values: commonContext.values.concat([
            { key: 'Year', value: 'Év' },
            { key: 'Upload PDF', value: 'PDF Feltöltése' },
          ]),
        },
        templateContext,
      ],
    },
  ],
};
