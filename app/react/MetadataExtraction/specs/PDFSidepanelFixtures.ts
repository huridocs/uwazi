import { fromJS } from 'immutable';
import { SuggestionState } from 'shared/types/suggestionSchema';

const entityA = {
  _id: '_idA',
  sharedId: 'sharedA',
  title: 'Current title',
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
  state: SuggestionState.pending,
  date: 0,
  page: 1,
  fileId: 'entity1File',
};

const reduxStore = {
  documentViewer: {
    uiState: fromJS({
      reference: {},
      snippet: {},
    }),
    doc: fromJS({}),
    targetDoc: fromJS({}),
    rawText: '',
    targetDocReferences: [],
    references: [],

    relationTypes: [],
    tocForm: [],
    tocBeingEdited: false,
    metadataExtraction: {
      selections: [],
    },
    sidepanel: {
      metadata: {},
      metadataForm: {
        $form: {
          initialValue: {},
          focus: false,
          pending: false,
          pristine: true,
          submitted: false,
          submitFailed: false,
          retouched: false,
          touched: false,
          valid: true,
          validating: false,
          validated: false,
          validity: {},
          errors: {},
          intents: [],
          model: 'documentViewer.sidepanel.metadata',
          value: {},
        },
      },
      snippets: {
        count: 0,
        metadata: [],
        fullText: [],
      },
      tab: '',
    },
  },
  templates: fromJS([
    {
      _id: 'template:_id',
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
  attachments: {
    progress: fromJS({}),
  },
  settings: { collection: fromJS({}) },
  user: fromJS({}),
};

export { entityA, entityAFile, suggestionForEntityA, reduxStore };
