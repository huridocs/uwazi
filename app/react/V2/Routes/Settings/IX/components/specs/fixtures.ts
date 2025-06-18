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

const property1: ClientPropertySchema = {
  _id: 'property1',
  label: 'Test Property',
  name: 'testProperty',
  type: 'text',
};

const template1: ClientTemplateSchema = {
  _id: 'template1',
  name: 'Test Template',
  properties: [
    {
      _id: 'property1',
      label: 'Test Property',
      name: 'testProperty',
      type: 'text',
    },
  ],
  commonProperties: [
    {
      _id: 'commonProperty1',
      label: 'Common Property',
      name: 'commonProperty',
      type: 'text',
    },
  ],
  color: '#000000',
  isEntity: true,
};

const defaultData: IXSuggestionsLoaderResponse = {
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
};

export { defaultData, suggestion1, property1, template1 };
