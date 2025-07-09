import { ClientPropertySchema, ClientTemplateSchema } from 'app/istore';
import { IXSuggestionsLoaderResponse, TableSuggestion, ixStatus } from '../../types';

const suggestion1: TableSuggestion = {
  _id: 'suggestion1',
  entityId: 'entity1',
  extractorId: 'extractor1',
  entityTemplateId: 'template1',
  sharedId: 'shared1',
  fileId: 'file1',
  entityTitle: 'Test Entity Title',
  propertyName: 'testProperty',
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

const template1: ClientTemplateSchema = {
  _id: 'template1',
  name: 'Test Template',
  properties: [numericProperty, textProperty, dateProperty],
};

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

export { loaderData, suggestion1, textProperty, numericProperty, dateProperty };
