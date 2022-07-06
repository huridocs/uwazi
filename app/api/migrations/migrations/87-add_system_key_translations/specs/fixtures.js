import db from 'api/utils/testing_db';

const templateId = db.id();
const defaultTemplateName = 'default template';
const defaultTemplateTitle = 'Title';

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

const fixtures = {
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
            { key: 'Drag properties here', value: 'Arrastra propiedades aquí' },
            { key: 'Duplicated label', value: 'Nombre duplicado' },
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
          values: commonContext.values.concat([
            { key: 'Priority sorting', value: 'Priority sort' },
            { key: 'Duplicated label', value: 'Duplicated label' },
          ]),
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
            { key: 'Duplicated label', value: 'Ismétlődő címke' },
          ]),
        },
        templateContext,
      ],
    },
  ],
};

export { fixtures, templateId, defaultTemplateName, defaultTemplateTitle };
