import uniqueID from '#shared/uniqueID.js';
import { PropertySchema } from '#shared/types/commonTypes.js';
import { ClientTemplateSchema, ClientProperty } from '#V2/shared/types.js';

import { t } from '#app/I18N/index.js';
import { PropertyRow } from './components/TemplateEditorTableComponents.js';

const commonPropertyTitle: ClientProperty = {
  label: 'Title',
  name: 'title',
  type: 'text',
  isCommonProperty: true,
};

const commonPropertyDateAdded: ClientProperty = {
  label: 'Date added',
  name: 'creationDate',
  type: 'date',
  isCommonProperty: true,
};

const commonPropertyDateModified: ClientProperty = {
  label: 'Date modified',
  name: 'editDate',
  type: 'date',
  isCommonProperty: true,
};

const properties: ClientProperty[] = [];

// @ts-ignore
const emptyTemplate: ClientTemplateSchema = {
  name: '',
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
    disableRowSelection: t('System', 'This property can not be deleted', null, false),
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

const isEmptyValue = (value: unknown): boolean =>
  value === null || value === undefined || value === '';

const normalizeOptionalId = (value: string | null | undefined): string | undefined =>
  isEmptyValue(value) ? undefined : value;

type InheritValue = { property: string; type: string } | string | null | undefined;

const normalizeInherit = (inherit: InheritValue): { property: string; type: string } | undefined => {
  if (isEmptyValue(inherit) || typeof inherit !== 'object') {
    return undefined;
  }

  if (inherit.property && inherit.type) {
    return { property: inherit.property, type: inherit.type };
  }

  return undefined;
};

const optionalIdMatches = (
  a: string | null | undefined,
  b: string | null | undefined
): boolean => normalizeOptionalId(a) === normalizeOptionalId(b);

const inheritMatches = (a: InheritValue, b: InheritValue): boolean =>
  JSON.stringify(normalizeInherit(a)) === JSON.stringify(normalizeInherit(b));

const relationshipConfigMatches = (
  a: {
    content?: string | null;
    relationType?: string | null;
    inherit?: InheritValue;
  },
  b: {
    content?: string | null;
    relationType?: string | null;
    inherit?: InheritValue;
  }
): boolean =>
  optionalIdMatches(a.content, b.content) &&
  optionalIdMatches(a.relationType, b.relationType) &&
  inheritMatches(a.inherit, b.inherit);

export {
  processDefaultProperties,
  processProperties,
  cleanProperty,
  emptyTemplate,
  translationsKeys,
  confirmationMessages,
  optionalIdMatches,
  inheritMatches,
  relationshipConfigMatches,
};
