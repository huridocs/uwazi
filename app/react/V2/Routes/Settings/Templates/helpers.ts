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
};
