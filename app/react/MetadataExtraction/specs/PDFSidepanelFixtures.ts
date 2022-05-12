import { fromJS } from 'immutable';
import { SuggestionState } from 'shared/types/suggestionSchema';

const entityA = {
  _id: '_idA',
  sharedId: 'sharedA',
  title: 'Current title',
  template: 'template_id',
  metadata: [],
};

const entityAFile = {
  _id: '_idFileA',
  filename: 'File A',
};

const suggestionForEntityA = {
  entityId: '_idEntityA',
  sharedId: 'sharedA',
  propertyName: 'title',
  entityTitle: 'Current title',
  currentValue: 'Current title',
  suggestedValue: 'Suggested title',
  segment: 'Suggested title',
  language: 'English',
  state: SuggestionState.labelMismatch,
  date: 0,
  page: 1,
  fileId: '_idFileA',
};

const reduxStore = {
  templates: fromJS([
    {
      _id: 'template_id',
      name: 'Documents',
      commonProperties: [
        {
          _id: '5bfbb1a0471dd0fc16ada148',
          label: 'Title',
          name: 'title',
          isCommonProperty: true,
          type: 'text',
          prioritySorting: false,
        },
        {
          _id: '5bfbb1a0471dd0fc16ada147',
          label: 'Date added',
          name: 'creationDate',
          isCommonProperty: true,
          type: 'date',
          prioritySorting: false,
        },
      ],
      properties: [],
      default: true,
    },
  ]),
};

const handleSave = jasmine.createSpy('handleSave');

export { entityA, entityAFile, suggestionForEntityA, reduxStore, handleSave };
