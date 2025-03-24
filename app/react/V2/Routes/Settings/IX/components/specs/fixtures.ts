import { ClientTemplateSchema } from 'app/istore';
import { PropertySchema } from 'shared/types/commonTypes';

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

const suggestion1 = {
  _id: '1',
  rowId: '1',
  language: 'es',
  propertyName: 'title',
  error: '',
  segment: 'suggested value',
  suggestedValue: 'suggested value',
  extractorSource: { pdf: true },
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
  rowId: '2',
  language: 'es',
  propertyName: 'title',
  error: '',
  segment: 'Entity 2',
  suggestedValue: 'Entity 2',
  extractorSource: { pdf: true },
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
  rowId: '3',
  language: 'es',
  propertyName: 'document_date',
  segment: 'Some value that contains a date',
  suggestedValue: 100,
  extractorSource: { pdf: true },
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
  rowId: '4',
  language: 'es',
  propertyName: 'document_date',
  segment: 'Some value that contains a date',
  suggestedValue: 500,
  extractorSource: { pdf: true },
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

const suggestion5 = {
  _id: '5',
  rowId: '5',
  language: 'es',
  propertyName: 'multiselect',
  segment: 'value1',
  suggestedValue: ['value3', 'value2'],
  extractorSource: { pdf: true },
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
  subRows: [
    {
      _id: '5',
      rowId: '5-value3',
      language: 'es',
      segment: 'value1',
      extractorId: '3',
      entityTemplateId: '3',
      entityTitle: '',
      fileId: '3',
      date: 1,
      state,
      propertyName: 'multiselect',
      extractorSource: { pdf: true },
      suggestedValue: 'value3',
      currentValue: '',
      entityId: 'entity3',
      sharedId: '3',
      isChild: true,
      disableRowSelection: true,
    },
    {
      language: 'es',
      rowId: '5-value2',
      segment: 'value1',
      extractorId: '3',
      entityTemplateId: '3',
      entityTitle: '',
      fileId: '3',
      date: 1,
      state,
      suggestedValue: 'value2',
      currentValue: 'value2',
      extractorSource: { pdf: true },
      propertyName: 'multiselect',
      entityId: 'entity3',
      sharedId: '3',
      _id: '5',
      isChild: true,
      disableRowSelection: true,
    },
    {
      language: 'es',
      rowId: '5-value1',
      segment: 'value1',
      extractorId: '3',
      entityTemplateId: '3',
      entityTitle: '',
      fileId: '3',
      date: 1,
      state,
      extractorSource: { pdf: true },
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

const templates: ClientTemplateSchema[] = [
  {
    _id: '1',
    name: 'Mecanismo',
    default: true,
    properties: [
      {
        _id: '13',
        label: 'Resumen',
        type: 'text',
        name: 'resumen',
      },
      {
        _id: '14',
        label: 'Descripción',
        type: 'markdown',
        name: 'descripcion',
      },
      {
        _id: '15',
        label: 'Fecha',
        type: 'date',
        name: 'fecha',
      },
    ],
    commonProperties: [
      {
        _id: '11',
        label: 'Title',
        name: 'title',
        type: 'text',
        isCommonProperty: true,
      },
      {
        _id: '12',
        label: 'Date added',
        name: 'creationDate',
        type: 'date',
        isCommonProperty: true,
      },
    ],
  },
  {
    _id: '2',
    name: 'Ordenes de la corte',
    properties: [
      {
        _id: '23',
        label: 'Fecha',
        type: 'date',
        name: 'fecha',
      },
      {
        _id: '24',
        label: 'Tipo',
        type: 'multiselect',
        content: 'thesaurus1',
        name: 'tipo',
      },
      {
        _id: '25',
        label: 'Categoría',
        type: 'select',
        content: 'thesaurus2',
        name: 'categor_a',
      },
    ],
    commonProperties: [
      {
        _id: '21',
        label: 'Title',
        name: 'title',
        type: 'text',
        isCommonProperty: true,
      },
      {
        _id: '22',
        label: 'Date added',
        name: 'creationDate',
        type: 'date',
        isCommonProperty: true,
      },
    ],
  },
  {
    _id: '3',
    name: 'Informe de admisibilidad',
    properties: [
      {
        _id: '33',
        label: 'Fecha',
        type: 'date',
        name: 'fecha',
      },
      {
        _id: '34',
        label: 'Resumen',
        type: 'text',
        name: 'resumen',
      },
      {
        _id: '35',
        label: 'Descripción',
        type: 'markdown',
        name: 'descripcion',
      },
    ],
    commonProperties: [
      {
        _id: '31',
        label: 'Title',
        name: 'title',
        isCommonProperty: true,
        type: 'text',
        prioritySorting: false,
      },
      {
        _id: '32',
        label: 'Date added',
        name: 'creationDate',
        isCommonProperty: true,
        type: 'date',
        prioritySorting: false,
      },
    ],
  },
  {
    _id: '4',
    name: 'País',
    properties: [
      {
        _id: '43',
        label: 'Tipo',
        type: 'select',
        content: 'thesaurus1',
        name: 'tipo',
      },
      {
        _id: '44',
        label: 'Categoría',
        type: 'select',
        content: 'thesaurus2',
        name: 'categor_a',
      },
      {
        _id: '45',
        label: 'Descripción',
        type: 'markdown',
        name: 'descripcion',
      },
    ],
    commonProperties: [
      {
        _id: '41',
        label: 'Title',
        name: 'title',
        type: 'text',
        isCommonProperty: true,
      },
      {
        _id: '42',
        label: 'Date added',
        name: 'creationDate',
        type: 'date',
        isCommonProperty: true,
      },
    ],
  },
  {
    _id: '5',
    name: 'Ordenes del presidente',
    properties: [
      {
        _id: '53',
        label: 'Categoría',
        type: 'select',
        content: 'thesaurus2',
        name: 'categor_a',
      },
      {
        _id: '53',
        label: 'Resumen de la order',
        type: 'markdown',
        name: 'resumen_de_la_orden',
      },
    ],
    commonProperties: [
      {
        _id: '51',
        label: 'Title',
        name: 'title',
        type: 'text',
        isCommonProperty: true,
      },
      {
        _id: '52',
        label: 'Date added',
        name: 'creationDate',
        type: 'date',
        isCommonProperty: true,
      },
    ],
  },
];

const templatesWithCommonProperties: ClientTemplateSchema[] = [
  {
    _id: '1',
    name: 'Mecanismo',
    default: true,
    properties: [
      {
        _id: '13',
        label: 'Opinión',
        type: 'markdown',
        name: 'opini_n',
      },
      {
        _id: '14',
        label: 'Descripción',
        type: 'markdown',
        name: 'descripcion',
      },
    ],
    commonProperties: [
      {
        _id: '11',
        label: 'Title',
        name: 'title',
        type: 'text',
        isCommonProperty: true,
      },
      {
        _id: '12',
        label: 'Date added',
        name: 'creationDate',
        type: 'date',
        isCommonProperty: true,
      },
    ],
  },
  {
    _id: '2',
    name: 'Ordenes de la corte',
    properties: [
      {
        _id: '23',
        label: 'Fecha',
        type: 'date',
        name: 'fecha',
      },
      {
        _id: '24',
        label: 'Opinión',
        type: 'markdown',
        name: 'opini_n',
      },
      {
        _id: '25',
        label: 'Descripción',
        type: 'markdown',
        name: 'descripcion',
      },
    ],
    commonProperties: [
      {
        _id: '21',
        label: 'Title',
        name: 'title',
        type: 'text',
        isCommonProperty: true,
      },
      {
        _id: '22',
        label: 'Date added',
        name: 'creationDate',
        type: 'date',
        isCommonProperty: true,
      },
    ],
  },
];

const extractors = [
  {
    _id: 'exractor1',
    name: 'Titles',
    property: 'title',
    source: { pdf: true },
    templates: ['1', '2', '3', '5'],
  },
  {
    _id: 'exractor2',
    name: 'Fechas',
    property: 'fecha',
    source: { property: 'descripcion' },
    templates: ['2'],
  },
  {
    _id: 'exractor3',
    name: 'Dates from titles',
    property: 'fecha',
    source: { property: 'title' },
    templates: ['1', '2', '3', '5'],
  },
];

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
  templates,
  templatesWithCommonProperties,
  extractors,
};
