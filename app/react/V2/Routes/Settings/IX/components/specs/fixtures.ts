import { ClientEntitySchema, ClientPropertySchema, ClientTemplateSchema } from 'app/istore';
import { IXSuggestionsLoaderResponse, TableSuggestion, ixStatus } from '../../types';

const suggestion1: TableSuggestion = {
  _id: 'suggestion1',
  entityId: 'entity1',
  extractorId: 'extractor1',
  entityTemplateId: 'template1',
  sharedId: 'shared1',
  fileId: 'file1',
  entityTitle: 'Test Entity Title',
  propertyName: 'text_property',
  suggestedValue: 'suggested value',
  currentValue: 'current value',
  segment: 'test segment',
  language: 'en',
  state: {
    labeled: false,
    withValue: true,
    withSuggestion: true,
    hasContext: true,
    obsolete: false,
    processing: false,
    error: false,
  },
  date: Date.now(),
  rowId: 'row1',
  extractorSource: { pdf: true },
};

const textProperty: ClientPropertySchema = {
  _id: 'textProperty',
  label: 'Test Property',
  name: 'text_property',
  type: 'text',
};

const numericProperty: ClientPropertySchema = {
  _id: 'numericProperty',
  label: 'Numeric Property',
  name: 'numeric_property',
  type: 'numeric',
};

const dateProperty: ClientPropertySchema = {
  _id: 'dateProperty',
  label: 'Date Property',
  name: 'date_property',
  type: 'date',
};

const selectProperty: ClientPropertySchema = {
  _id: 'selectProperty',
  label: 'Select Property',
  name: 'select_property',
  type: 'select',
  content: 'thesaurus1',
};

const relationshipProperty: ClientPropertySchema = {
  _id: 'relationshipProperty',
  label: 'Relationship Property',
  name: 'relationship_property',
  type: 'relationship',
  content: 'template2',
};

const template1: ClientTemplateSchema = {
  _id: 'template1',
  name: 'Test Template',
  properties: [numericProperty, textProperty, dateProperty, selectProperty, relationshipProperty],
};

const entity1: ClientEntitySchema = {
  _id: 'entity1',
  title: 'Test Entity Title',
  sharedId: 'shared1',
  metadata: {
    text_property: [{ value: 'current text value' }],
    numeric_property: [{ value: 42 }],
    date_property: [{ value: 1640995200 }],
    markdown_property: [{ value: 'current markdown value' }],
    select_property: [{ value: 'option1' }],
    relationship_property: [{ value: 'entity2' }],
  },
};

const thesauri = [
  {
    _id: 'thesaurus1',
    name: 'Test Thesaurus',
    values: [
      {
        id: 'option1',
        label: 'Option 1',
        values: [],
      },
      {
        id: 'option2',
        label: 'Option 2',
        values: [],
      },
      {
        id: 'suggested_option',
        label: 'Suggested Option',
        values: [],
      },
    ],
  },
];

const loaderData: IXSuggestionsLoaderResponse = {
  suggestions: [],
  extractor: {
    _id: 'extractor1',
    name: 'Test Extractor',
    property: 'testProperty',
    source: {
      pdf: true,
    },
    templates: ['template1'],
  },
  templates: [template1],
  aggregation: {},
  currentStatus: ixStatus.ready,
  totalPages: 1,
  activeFilters: 0,
  total: 10,
};

export {
  loaderData,
  suggestion1,
  textProperty,
  numericProperty,
  dateProperty,
  selectProperty,
  relationshipProperty,
  template1,
  entity1,
  thesauri,
};
