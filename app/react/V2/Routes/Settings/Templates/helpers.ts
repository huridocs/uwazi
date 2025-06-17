import uniqueID from 'shared/uniqueID';
import { PropertySchema } from 'shared/types/commonTypes';
import { ClientTemplateSchema, ClientProperty } from 'V2/shared/types';

import { PropertyRow } from './components/TemplateEditorTableComponents';

const commonPropertyTitle: ClientProperty = {
  label: 'Title',
  name: 'title',
  type: 'text',
  isCommonProperty: true,
};

const commonPropertyDateAdded: ClientProperty = {
  label: 'Date added',
  name: 'date_added',
  type: 'date',
  isCommonProperty: true,
};

const commonPropertyDateModified: ClientProperty = {
  label: 'Date modified',
  name: 'date_modified',
  type: 'date',
  isCommonProperty: true,
};

const properties: ClientProperty[] = [];

// @ts-ignore
const emptyTemplate: ClientTemplateSchema = {
  name: '',
  color: '#C03B22',
  entityViewPage: '',
  properties,
  commonProperties: [commonPropertyTitle, commonPropertyDateAdded, commonPropertyDateModified],
};

const translationsKeys = {
  date: 'property date',
  daterange: 'property daterange',
  generatedid: 'property generatedid',
  geolocation: 'property geolocation',
  image: 'property image',
  link: 'property link',
  markdown: 'property markdown',
  media: 'property media',
  multidate: 'property multidate',
  multidaterange: 'property multidaterange',
  multiselect: 'property multiselect',
  numeric: 'property numeric',
  preview: 'property preview',
  relationship: 'property relationship',
  select: 'property select',
  text: 'property text',
  nested: 'property nested',
};

const confirmationMessages = {
  templateConflict: {
    title: 'Template conflict',
    key: 'Mapping conflict error',
    text: `A reindex of your collection is necessary. The reason may vary
     -- from certain changes made to a template's property to new fields
     that need to be populated across entities.
     This process will not negatively affect the data in your collection.
     It can last a few minutes and some parts of your collection might take
     some time to reappear in the Library, but this is temporary. Do you want to continue?`,
  },
  largeNumberOfEntities: {
    title: 'Lengthy reindex process',
    key: 'Template with a long number of entities',
    text: `The template has changed and the associated entities will be re-indexed,
    this process may take several minutes, do you want to continue?`,
  },
};

const processDefaultProperties = (props: PropertySchema[]) =>
  props.map(prop => ({
    ...prop,
    rowId: uniqueID(),
    disableRowDnD: true,
    disableRowSelection: true,
  }));

const processProperties = (props: PropertySchema[]) =>
  props.map(prop => ({
    ...prop,
    rowId: uniqueID(),
  }));

const cleanProperty = (prop: PropertyRow) => {
  const { rowId, disableRowDnD, disableRowSelection, ...rest } = prop;
  return rest;
};

export {
  processDefaultProperties,
  processProperties,
  cleanProperty,
  emptyTemplate,
  translationsKeys,
  confirmationMessages,
};
