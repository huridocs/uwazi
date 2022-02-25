import db from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';

const templateId = db.id();
const relatedTo = db.id();
const templateToBeInherited = db.id();
const propertyToBeInherited = db.id();
const thesauriId1 = db.id();
const thesauriId2 = db.id();
const thesauriId4 = db.id();

export default {
  templates: [
    {
      _id: templateId,
      name: 'DuplicateName',
      properties: [],
    },
    {
      _id: templateToBeInherited,
      name: 'template to be inherited',
      commonProperties: [{ name: 'title', label: 'Title', type: propertyTypes.text }],
      properties: [{ _id: propertyToBeInherited, name: 'inherit_me', type: propertyTypes.text }],
      default: true,
    },
    {
      name: 'template inheriting from another',
      commonProperties: [{ name: 'title', label: 'Title', type: propertyTypes.text }],
      properties: [
        {
          type: propertyTypes.relationship,
          name: 'inherit',
          label: 'Inherit',
          relationtype: relatedTo,
          content: templateToBeInherited,
          inherit: {
            property: propertyToBeInherited,
            type: propertyTypes.text,
          },
        },
      ],
    },
    {
      _id: db.id(),
      name: 'template with shared properties',
      properties: [
        {
          type: propertyTypes.select,
          name: 'sharedproperty1',
          label: 'sharedProperty1',
          content: thesauriId1.toString(),
        },
        {
          type: propertyTypes.select,
          name: 'sharedproperty2',
          label: 'sharedProperty2',
          content: thesauriId2.toString(),
        },
        {
          type: propertyTypes.numeric,
          name: 'sharedproperty3',
          label: 'sharedProperty3',
        },
        {
          type: propertyTypes.relationship,
          content: 'template1',
          relationtype: 'relationType1',
          name: 'sharedrelationship1',
          label: 'sharedRelationship1',
        },
        {
          name: 'validproperty4',
          label: 'validProperty4',
          type: propertyTypes.multiselect,
          content: thesauriId4.toString(),
        },
        {
          name: 'validpropertydate',
          label: 'validPropertyDate',
          type: propertyTypes.multidate,
        },
        {
          name: 'validpropertydaterange',
          label: 'validPropertyDateRange',
          type: propertyTypes.multidaterange,
        },
        {
          name: 'validpropertyrichtext',
          label: 'validPropertyRichText',
          type: propertyTypes.text,
        },
        {
          name: 'validpropertymultiselect',
          label: 'validPropertyMultiSelect',
          type: propertyTypes.select,
          content: thesauriId4.toString(),
        },
        {
          name: 'validpropertymultidate',
          label: 'validPropertyMultiDate',
          type: propertyTypes.date,
        },
        {
          name: 'validpropertymultidaterange',
          label: 'validPropertyMultiDateRange',
          type: propertyTypes.daterange,
        },
      ],
      commonProperties: [{ name: 'title', label: 'Title' }],
    },
  ],
  pages: [
    {
      _id: db.id(),
      title: 'A page for entity view',
      sharedId: 'aFS2dsSdas',
      entityView: true,
    },
    {
      _id: db.id(),
      title: 'A page not for entity view',
      sharedId: 'iExistButImNotForEntityView',
      entityView: false,
    },
  ],
  relationtypes: [{ _id: relatedTo, name: 'related to' }],
  dictionaries: [
    { _id: thesauriId1, name: 'options' },
    { _id: thesauriId2, name: 'options' },
    { _id: thesauriId4, name: 'options' },
  ],
};

export {
  templateId,
  templateToBeInherited,
  propertyToBeInherited,
  thesauriId1,
  thesauriId2,
  thesauriId4,
};
