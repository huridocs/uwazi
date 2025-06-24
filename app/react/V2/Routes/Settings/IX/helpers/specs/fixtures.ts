import { ClientTemplateSchema } from 'app/istore';

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

export { templates, templatesWithCommonProperties, extractors };
