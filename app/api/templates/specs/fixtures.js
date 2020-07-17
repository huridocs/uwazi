/**
 * /* eslint-disable
 *
 * @format
 */

import db from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';

const templateToBeEditedId = db.id();
const templateToBeDeleted = '589af97080fc0b23471d67f1';
const templateWithContents = db.id();
const swapTemplate = db.id();
const relatedTo = db.id();
const templateToBeInherited = db.id();
const propertyToBeInherited = db.id();
export default {
  templates: [
    {
      _id: templateToBeEditedId,
      name: 'template to be edited',
      properties: [],
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      default: true,
    },
    {
      _id: db.id(templateToBeDeleted),
      name: 'to be deleted',
      properties: [],
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
    },
    {
      _id: db.id(),
      name: 'duplicated name',
      properties: [],
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
    },
    {
      _id: db.id(),
      name: 'thesauri template',
      properties: [
        { type: propertyTypes.select, content: 'thesauri1', label: 'select', name: 'select' },
        { type: propertyTypes.relationship, content: templateToBeDeleted, label: 'select2' },
      ],
      commonProperties: [{ name: 'title', label: 'Title' }],
    },
    {
      _id: db.id(),
      name: 'thesauri template 2',
      properties: [
        { type: propertyTypes.select, content: 'thesauri1', label: 'select2', name: 'select2' },
        { type: propertyTypes.select, content: templateToBeDeleted, label: 'selectToBeDeleted' },
      ],
      commonProperties: [{ name: 'title', label: 'Title' }],
    },
    {
      _id: db.id(),
      name: 'thesauri template 3',
      properties: [
        { type: propertyTypes.text, label: 'text' },
        { type: propertyTypes.text, label: 'text2' },
        {
          type: propertyTypes.select,
          content: templateToBeDeleted,
          label: 'selectToBeDeleted',
          name: 'selecttobedeleted',
        },
      ],
      commonProperties: [{ name: 'title', label: 'Title' }],
    },
    {
      _id: templateWithContents,
      name: 'content template',
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      properties: [
        {
          id: '1',
          type: propertyTypes.select,
          content: 'thesauri1',
          label: 'select3',
          name: 'select3',
        },
        {
          id: '2',
          type: propertyTypes.multiselect,
          content: 'thesauri2',
          label: 'select4',
          name: 'select4',
        },
      ],
    },
    {
      _id: swapTemplate,
      name: 'swap names template',
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      properties: [
        { id: '1', type: propertyTypes.text, name: 'text', label: 'Text' },
        { id: '2', type: propertyTypes.select, name: 'select5', label: 'Select5' },
      ],
    },
    {
      _id: templateToBeInherited,
      name: 'template to be inherited',
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      properties: [{ _id: propertyToBeInherited, name: 'inherit_me', type: 'text' }],
      default: true,
    },
    {
      name: 'template inheriting from another',
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      properties: [
        {
          id: '1',
          type: propertyTypes.relationship,
          name: 'inherit',
          label: 'Inherit',
          relationtype: relatedTo,
          content: templateToBeInherited,
          inherit: true,
          inheritProperty: propertyToBeInherited,
        },
      ],
    },
  ],
  relationtypes: [{ _id: relatedTo, name: 'related to' }],
  settings: [
    {
      _id: db.id(),
      site_name: 'Uwazi',
      languages: [{ key: 'en', label: 'English', default: true }],
    },
  ],
};

export {
  templateToBeEditedId,
  templateToBeDeleted,
  templateWithContents,
  swapTemplate,
  templateToBeInherited,
  propertyToBeInherited,
};
