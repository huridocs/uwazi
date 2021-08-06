import db from 'api/utils/testing_db';

export const nonExistingTemplateId = db.id();

export const defaultTemplateName = 'default template';
export const defaultTemplateId = db.id();
export const templateChangedOnceName = 'changed once';
export const templateChangedOnceId = db.id();
export const templateChangedCorrectlyName = 'changed multiple correct';
export const templateChangedCorrectlyId = db.id();
export const templateComplexName = 'with properties';
export const templateComplexId = db.id();

export const defaultTemplateTitle = 'Title';
export const firstNewTitle = 'First New Title';
export const secondNewTitle = 'Second New Title';
export const thirdNewTitle = 'Third New Title';
export const fourthNewTitle = 'Fourth New Title';

const commonContexts = [
  //context for the unchanged template - correct
  {
    id: defaultTemplateId.toString(),
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
  },
  //context for the template changed once - correct
  {
    id: templateChangedOnceId.toString(),
    label: templateChangedOnceName,
    type: 'Entity',
    values: [
      {
        key: templateChangedOnceName,
        value: templateChangedOnceName,
      },
      {
        key: defaultTemplateTitle,
        value: defaultTemplateTitle,
      },
      {
        key: firstNewTitle,
        value: firstNewTitle,
      },
    ],
  },
  //context for a template changed multiple times - correct
  {
    id: templateChangedCorrectlyId.toString(),
    label: templateChangedCorrectlyName,
    type: 'Entity',
    values: [
      {
        key: templateChangedCorrectlyName,
        value: templateChangedCorrectlyName,
      },
      {
        key: defaultTemplateTitle,
        value: defaultTemplateTitle,
      },
      {
        key: fourthNewTitle,
        value: fourthNewTitle,
      },
    ],
  },
  //context for a template with properties and other translations
  {
    id: templateComplexId.toString(),
    label: templateComplexName,
    type: 'Entity',
    values: [
      {
        key: templateComplexName,
        value: templateComplexName,
      },
      {
        key: defaultTemplateTitle,
        value: defaultTemplateTitle,
      },
      {
        key: firstNewTitle,
        value: firstNewTitle,
      },
      {
        key: secondNewTitle,
        value: secondNewTitle,
      },
      {
        key: thirdNewTitle,
        value: thirdNewTitle,
      },
      {
        key: fourthNewTitle,
        value: fourthNewTitle,
      },
      {
        key: 'date_title',
        value: 'date_title',
      },
      {
        key: 'rich_text_title',
        value: 'rich_text_title',
      },
      {
        key: 'Geolocation',
        value: 'Geolocation',
      },
      {
        key: 'Generated ID',
        value: 'Generated ID',
      },
      {
        key: 'non_existing_entry',
        value: 'non_existing_entry',
      },
    ],
  },
  //unrelated context
  {
    id: 'Menu',
    label: 'Menu',
    type: 'Uwazi UI',
    values: [
      {
        key: 'some-menu-item',
        value: 'some-menu-item',
      },
      {
        key: 'other-menu-item',
        value: 'other-menu-item',
      },
    ],
  },
  //nonexisting template
  {
    id: nonExistingTemplateId,
    label: 'NonExistingTemplateName',
    type: 'Entity',
    values: [
      {
        key: 'NonExistingTemplateName',
        value: 'NonExistingTemplateName',
      },
    ],
  },
];

export default {
  templates: [
    //default template name - correct
    {
      _id: defaultTemplateId,
      name: defaultTemplateName,
      commonProperties: [{ name: 'title', label: defaultTemplateTitle, type: 'text' }],
      properties: [],
    },
    //template changed once - correct
    {
      _id: templateChangedOnceId,
      name: templateChangedOnceName,
      commonProperties: [{ name: 'title', label: firstNewTitle, type: 'text' }],
      properties: [],
    },
    //template changed multiple times - correct
    {
      _id: templateChangedCorrectlyId,
      name: templateChangedCorrectlyName,
      commonProperties: [{ name: 'title', label: fourthNewTitle, type: 'text' }],
      properties: [],
    },
    //template with properties and other leftover translations
    {
      _id: templateComplexId,
      name: templateComplexName,
      commonProperties: [{ name: 'title', label: fourthNewTitle, type: 'text' }],
      properties: [
        { label: 'date_title', name: 'date_title', type: 'date' },
        { label: 'rich_text_title', name: 'rich_text_title', type: 'markdown' },
        { label: 'Geolocation', name: 'geolocation_geolocation', type: 'geolocation' },
        { label: 'Generated ID', name: 'generatedid', type: 'generated_id' },
      ],
    },
  ],
  translations: [
    {
      _id: db.id(),
      locale: 'es',
      contexts: commonContexts,
    },
    {
      _id: db.id(),
      locale: 'en',
      contexts: commonContexts,
    },
  ],
};
