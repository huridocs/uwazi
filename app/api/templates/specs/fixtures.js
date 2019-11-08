/* eslint-disable */
import db from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';

const templateToBeEditedId = db.id();
const templateToBeDeleted = '589af97080fc0b23471d67f1';
const templateWithContents = db.id();
const swapTemplate = db.id();
export default {
  templates: [
    {
      _id: templateToBeEditedId,
      name: 'template to be edited',
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      default: true
    },
    {
      _id: db.id(templateToBeDeleted),
      name: 'to be deleted',
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }]
    },
    {
      _id: db.id(),
      name: 'duplicated name',
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }]
    },
    {
      _id: db.id(),
      name: 'thesauri template',
      properties: [
        { type: propertyTypes.select, content: 'thesauri1', label: 'select' },
        { type: propertyTypes.relationship, content: templateToBeDeleted, label: 'select2' },
      ],
      commonProperties: [{ name: 'title', label: 'Title' }]
    },
    {
      _id: db.id(),
      name: 'thesauri template 2',
      properties: [
        { type: propertyTypes.select, content: 'thesauri1', label: 'select2' },
        { type: propertyTypes.select, content: templateToBeDeleted, label: 'selectToBeDeleted' },
      ],
      commonProperties: [{ name: 'title', label: 'Title' }]
    },
    {
      _id: db.id(),
      name: 'thesauri template 3',
      properties: [
        { type: propertyTypes.text, label: 'text' },
        { type: propertyTypes.text, label: 'text2' },
        { type: propertyTypes.select, content: templateToBeDeleted, label: 'selectToBeDeleted' },
      ],
      commonProperties: [{ name: 'title', label: 'Title' }]
    },
    {
      _id: templateWithContents,
      name: 'content template',
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      properties: [
        { id: '1', type: propertyTypes.select, content: 'thesauri1', label: 'select3' },
        { id: '2', type: propertyTypes.multiselect, content: 'thesauri2', label: 'select4' }
      ]
    },
    {
      _id: swapTemplate,
      name: 'swap names template',
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      properties: [
        { id: '1', type: propertyTypes.text, name: 'text', label: 'Text' },
        { id: '2', type: propertyTypes.select, name: 'select', label: 'Select' }
      ]
    }
  ],
  settings: [
    {
      _id: db.id(),
      site_name: 'Uwazi',
      languages: [
        { key: 'en', label: 'English', default: true },
      ]
    }
  ]
};

export {
  templateToBeEditedId,
  templateToBeDeleted,
  templateWithContents,
  swapTemplate
};
