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

export { suggestion1, suggestion2, suggestion3, suggestion4, entity1, entity2 };
