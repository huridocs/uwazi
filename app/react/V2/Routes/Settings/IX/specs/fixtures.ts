import { ClientEntitySchema } from 'app/istore';
import { ClientTemplateSchema } from 'V2/shared/types';
import { ClientThesaurus } from 'app/apiResponseTypes';
import { ixStatus, IXSuggestionsLoaderResponse } from '../types';

const thesauri: ClientThesaurus[] = [
  {
    _id: 'thesauri1',
    name: 'thesaurus1',
    values: [
      { id: '1', label: 'Red' },
      { id: '2', label: 'Blue' },
      { id: '3', label: 'Green' },
    ],
  },
  { _id: 'thesauri2', name: 'thesaurus2', values: [{ id: '1', label: 'Nicaragua' }] },
];

const template1: ClientTemplateSchema = {
  _id: 'template1',
  name: 'Template 1',
  properties: [
    {
      content: 'thesauri1',
      _id: '1.1',
      name: 'select_property',
      type: 'select',
      label: 'Select Property',
    },
    {
      content: 'thesauri1',
      _id: '1.2',
      name: 'multi_select_property',
      type: 'multiselect',
      label: 'Multiselect Property',
    },
  ],
  commonProperties: [
    {
      _id: '1.0',
      label: 'Title',
      name: 'title',
      type: 'text',
    },
  ],
};

const entity1: ClientEntitySchema = {
  _id: 'entity1',
  title: 'Entity 1',
  sharedId: 'shared1',
  metadata: {
    select_property: [{ value: thesauri[0].values[0].id! }],
  },
};

const entity2: ClientEntitySchema = {
  _id: 'entity2',
  title: 'Entity 2',
  sharedId: 'shared2',
  metadata: {},
};

const loaderData: IXSuggestionsLoaderResponse = {
  suggestions: [
    {
      _id: 'suggestion1',
      status: 'ready',
      extractorId: 'extractor1',
      fileId: 'file1',
      propertyName: 'select_property',
      language: 'en',
      suggestedValue: thesauri[0].values[2].id!,
      date: 1,
      segment: '',
      currentValue: thesauri[0].values[0].id!,
      entityTitle: entity1.title!,
      state: {
        labeled: true,
        withValue: true,
        withSuggestion: false,
        match: false,
        hasContext: true,
        obsolete: false,
        processing: false,
        error: false,
      },
      sharedId: entity1.sharedId!,
      entityId: entity1._id as string,
      entityTemplateId: template1._id,
      rowId: 'suggestion1',
      disableRowSelection: false,
      extractorSource: {
        pdf: true,
      },
      useForTraining: true,
    },
    {
      _id: 'suggestion2',
      status: 'ready',
      extractorId: 'extractor1',
      fileId: 'file1',
      propertyName: 'select_property',
      language: 'en',
      suggestedValue: thesauri[0].values[2].id!,
      date: 1,
      segment: '',
      entityTitle: entity2.title!,
      state: {
        labeled: true,
        withValue: true,
        withSuggestion: false,
        match: false,
        hasContext: true,
        obsolete: false,
        processing: false,
        error: false,
      },
      sharedId: entity2.sharedId!,
      entityId: entity2._id as string,
      entityTemplateId: template1._id,
      rowId: 'suggestion2',
      disableRowSelection: false,
      extractorSource: {
        pdf: true,
      },
      useForTraining: false,
    },
  ],
  totalPages: 1,
  extractor: {
    _id: 'extractor1',
    name: 'Extractor 1',
    property: 'select_property',
    templates: [template1._id],
    source: {
      pdf: true,
    },
  },
  templates: [template1],
  aggregation: {
    total: 2,
    labeled: 0,
    nonLabeled: 0,
    match: 0,
    mismatch: 0,
    obsolete: 0,
    error: 0,
    noContext: 0,
    nonProcessed: 0,
  },
  currentStatus: ixStatus.ready,
  activeFilters: 0,
  total: 2,
};

const nestedSuggestions: IXSuggestionsLoaderResponse = {
  suggestions: [
    {
      _id: 'nested1',
      status: 'ready',
      extractorId: 'extractor2',
      fileId: 'file1',
      propertyName: 'multi_select_property',
      language: 'en',
      suggestedValue: [
        { id: '2', label: 'Blue' },
        { id: '3', label: 'Green' },
      ],
      date: 1,
      segment: '',
      currentValue: [{ id: '1', label: 'Red' }],
      entityTitle: 'Entity 1',
      state: {
        labeled: true,
        withValue: true,
        withSuggestion: false,
        match: false,
        hasContext: true,
        obsolete: false,
        processing: false,
        error: false,
      },
      sharedId: 'shared1',
      entityId: '_id1',
      entityTemplateId: 'template1',
      useForTraining: false,
      rowId: 'nested1',
      extractorSource: {
        pdf: true,
      },
    },
    {
      _id: 'nested2',
      status: 'ready',
      extractorId: 'extractor2',
      fileId: '2',
      propertyName: 'multi_select_property',
      language: 'en',
      suggestedValue: [{ id: '2', label: 'Blue' }],
      date: 1,
      segment: '',
      currentValue: [{ id: '3', label: 'Green' }],
      entityTitle: 'Entity 2',
      state: {
        labeled: true,
        withValue: true,
        withSuggestion: false,
        match: false,
        hasContext: true,
        obsolete: false,
        processing: false,
        error: false,
      },
      sharedId: 'shared2',
      entityId: '_id2',
      entityTemplateId: 'template1',
      useForTraining: true,
      rowId: 'nested2',
      extractorSource: {
        pdf: true,
      },
    },
  ],
  total: 2,
  totalPages: 1,
  extractor: {
    _id: 'extractor2',
    name: 'Extractor 2',
    property: 'multi_select_property',
    templates: [template1._id],
    source: {
      pdf: true,
    },
  },
  templates: [template1],
  aggregation: {
    total: 2,
    labeled: 0,
    nonLabeled: 0,
    match: 0,
    mismatch: 0,
    obsolete: 0,
    error: 0,
    noContext: 0,
    nonProcessed: 0,
  },
  currentStatus: ixStatus.ready,
  activeFilters: 0,
};

export { nestedSuggestions, loaderData, thesauri, entity1, entity2 };
