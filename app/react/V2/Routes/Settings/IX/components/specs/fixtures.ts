import { extractorId } from 'api/activitylog/specs/fixturesParser';
import { entityTemplateId } from 'api/i18n/specs/fixtures';
import meta from 'app/stories/Card.stories';
import { PropertySchema } from 'shared/types/commonTypes';
import { child } from 'winston';

const suggestion1 = {
  _id: '1',
  language: 'es',
  propertyName: 'title',
  error: '',
  segment: 'suggested value',
  suggestedValue: 'suggested value',
  state: {
    match: false,
    labeled: true,
    withValue: true,
    withSuggestion: true,
    hasContext: true,
    obsolete: false,
    processing: false,
    error: false,
  },
  selectionRectangles: [
    {
      left: 0,
      top: 0,
      width: 250,
      height: 250,
      page: '1',
    },
  ],
  currentValue: 'Entity 1',
  entityTitle: 'Entity 1',
  entityId: 'entity1',
  extractorId: '1',
  entityTemplateId: '1',
  sharedId: '1',
  fileId: '1',
  date: 1,
};

const suggestion2 = {
  _id: '2',
  language: 'es',
  propertyName: 'title',
  error: '',
  segment: 'Entity 2',
  suggestedValue: 'Entity 2',
  state: {
    match: true,
    labeled: true,
    withValue: true,
    withSuggestion: true,
    hasContext: true,
    obsolete: false,
    processing: false,
    error: false,
  },
  selectionRectangles: [
    {
      left: 0,
      top: 0,
      width: 250,
      height: 250,
      page: '1',
    },
  ],
  currentValue: 'Entity 2',
  entityTitle: 'Entity 2',
  entityId: 'entity2',
  extractorId: '1',
  entityTemplateId: '1',
  sharedId: '2',
  fileId: '2',
  date: 1,
};

const suggestion3 = {
  _id: '3',
  language: 'es',
  propertyName: 'document_date',
  segment: 'Some value that contains a date',
  suggestedValue: 100,
  state: {
    match: true,
    labeled: true,
    withValue: true,
    withSuggestion: true,
    hasContext: true,
    obsolete: false,
    processing: false,
    error: false,
  },
  selectionRectangles: [
    {
      left: 0,
      top: 0,
      width: 250,
      height: 250,
      page: '1',
    },
  ],
  currentValue: 100,
  entityTitle: 'Entity 2',
  entityId: 'entity2',
  extractorId: '2',
  entityTemplateId: '2',
  sharedId: '2',
  fileId: '3',
  date: 1,
};

const suggestion4 = {
  _id: '4',
  language: 'es',
  propertyName: 'document_date',
  segment: 'Some value that contains a date',
  suggestedValue: 500,
  state: {
    match: false,
    labeled: true,
    withValue: true,
    withSuggestion: true,
    hasContext: true,
    obsolete: false,
    processing: false,
    error: false,
  },
  selectionRectangles: [
    {
      left: 0,
      top: 0,
      width: 250,
      height: 250,
      page: '1',
    },
  ],
  currentValue: 100,
  entityTitle: 'Entity 5',
  entityId: 'entity5',
  extractorId: '2',
  entityTemplateId: '2',
  sharedId: '5',
  fileId: '5',
  date: 1,
};

const entity1 = {
  _id: 'entity1',
  language: 'es',
  sharedId: '1',
  title: 'Entity 1',
};

const entity2 = {
  _id: 'entity2',
  language: 'es',
  sharedId: '2',
  title: 'Entity 2',
  metadata: {
    document_date: [
      {
        value: 100,
      },
    ],
  },
};

//multi value
const entity3 = {
  _id: 'entity3',
  language: 'es',
  sharedId: '3',
  title: 'Entity 3',
  metadata: {
    multiselect: {
      value: ['value1', 'value2'],
    },
  },
};

const state = {
  match: false,
  labeled: true,
  withValue: true,
  withSuggestion: true,
  hasContext: true,
  obsolete: false,
  processing: false,
  error: false,
};

const suggestion5 = {
  _id: '5',
  language: 'es',
  propertyName: 'multiselect',
  segment: 'value1',
  suggestedValue: ['value3', 'value2'],
  state,
  currentValue: ['value1', 'value2'],
  entityTitle: 'Entity 3',
  entityId: 'entity3',
  extractorId: '3',
  entityTemplateId: '3',
  sharedId: '3',
  fileId: '3',
  date: 1,
  isChild: false,
  children: [
    {
      _id: '5',
      language: 'es',
      segment: 'value1',
      extractorId: '3',
      entityTemplateId: '3',
      entityTitle: 'Entity 3',
      fileId: '3',
      date: 1,
      state,
      propertyName: 'multiselect',
      suggestedValue: 'value3',
      currentValue: '',
      entityId: 'entity3',
      sharedId: '3',
      isChild: true,
      disableRowSelection: true,
    },
    {
      language: 'es',
      segment: 'value1',
      extractorId: '3',
      entityTemplateId: '3',
      entityTitle: 'Entity 3',
      fileId: '3',
      date: 1,
      state,
      suggestedValue: 'value2',
      currentValue: 'value2',
      propertyName: 'multiselect',
      entityId: 'entity3',
      sharedId: '3',
      _id: '5',
      isChild: true,
      disableRowSelection: true,
    },
    {
      language: 'es',
      segment: 'value1',
      extractorId: '3',
      entityTemplateId: '3',
      entityTitle: 'Entity 3',
      fileId: '3',
      date: 1,
      state,
      suggestedValue: '',
      currentValue: 'value1',
      propertyName: 'multiselect',
      entityId: 'entity3',
      sharedId: '3',
      _id: '5',
      isChild: true,
      disableRowSelection: true,
    },
  ],
};

const propertyTitle: PropertySchema = {
  type: 'text',
  name: 'title',
  label: 'Title',
};

const propertyDocumentDate: PropertySchema = {
  type: 'date',
  name: 'document_date',
  label: 'Document date',
};

const propertyMultiselect: PropertySchema = {
  type: 'multiselect',
  name: 'multiselect',
  label: 'Multiselect',
};

export {
  suggestion1,
  suggestion2,
  suggestion3,
  suggestion4,
  suggestion5,
  entity1,
  entity2,
  entity3,
  propertyTitle,
  propertyDocumentDate,
  propertyMultiselect,
};
