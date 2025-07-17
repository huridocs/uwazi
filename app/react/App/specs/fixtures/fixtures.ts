/* eslint-disable max-lines */
import { ClientThesaurus } from 'app/apiResponseTypes';
import { ClientTemplateSchema, ClientTranslationSchema } from 'app/istore';

const currentTranslations: ClientTranslationSchema[] = [
  {
    locale: 'en',
    contexts: [
      {
        id: 'id1',
        label: 'Documents',
        type: 'Entity',
        values: {
          Documents: 'Document',
          Select: 'Select',
          Title: 'Title',
        },
      },
    ],
  },
  {
    locale: 'es',
    contexts: [
      {
        id: 'id1',
        label: 'Documents',
        type: 'Entity',
        values: {
          Documents: 'Documento',
          Select: 'Selector',
          Title: 'Título',
        },
      },
    ],
  },
];

const updatedTranslation: ClientTranslationSchema = {
  locale: 'en',
  contexts: [
    {
      id: 'id1',
      label: 'Documents',
      type: 'Entity',
      values: {
        Documents: 'Document',
        Select: 'Select',
        Title: 'Update title',
      },
    },
  ],
};

const newLanguage: ClientTranslationSchema = {
  locale: 'fr',
  contexts: [
    {
      id: 'id1',
      label: 'Documents',
      type: 'Entity',
      values: {
        Documents: 'Document',
        Select: 'Select',
        Title: 'Title',
      },
    },
  ],
};

const translationKeysChangeArguments = [
  {
    language: 'en',
    value: 'Select',
    key: 'Select',
    context: {
      id: 'id1',
      label: 'Documents',
      type: 'Entity',
    },
  },
  {
    language: 'es',
    value: 'Select ES',
    key: 'Select',
    context: {
      id: 'id1',
      label: 'Documents',
      type: 'Entity',
    },
  },
  {
    language: 'fr',
    value: 'Select FR',
    key: 'Select',
    context: {
      id: 'id1',
      label: 'Documents',
      type: 'Entity',
    },
  },
];

const translationKeysChangeResult = [
  {
    locale: 'en',
    contexts: [
      {
        id: 'id1',
        label: 'Documents',
        type: 'Entity',
        values: {
          Documents: 'Document',
          Select: 'Select',
          Title: 'Title',
        },
      },
    ],
  },
  {
    locale: 'es',
    contexts: [
      {
        id: 'id1',
        label: 'Documents',
        type: 'Entity',
        values: {
          Documents: 'Documento',
          Select: 'Select ES',
          Title: 'Título',
        },
      },
    ],
  },
  {
    locale: 'fr',
    contexts: [
      {
        id: 'id1',
        label: 'Documents',
        type: 'Entity',
        values: {
          Documents: 'Document',
          Select: 'Select FR',
          Title: 'Title',
        },
      },
    ],
  },
];

const templates: ClientTemplateSchema[] = [
  {
    _id: '1',
    name: 'Template 1',
    commonProperties: [
      {
        _id: '11',
        label: 'Title',
        name: 'title',
        type: 'text',
        isCommonProperty: true,
      },
    ],
    properties: [
      {
        _id: '12',
        label: 'Description',
        name: 'description',
        type: 'markdown',
      },
    ],
  },
  {
    _id: '2',
    name: 'Template 2',
    commonProperties: [
      {
        _id: '21',
        label: 'Title',
        name: 'title',
        type: 'text',
        isCommonProperty: true,
      },
    ],
    properties: [
      {
        _id: '22',
        label: 'Summary',
        name: 'summary',
        type: 'text',
      },
    ],
  },
  {
    _id: '3',
    name: 'Template 3',
    commonProperties: [
      {
        _id: '31',
        label: 'Title',
        name: 'title',
        type: 'text',
        isCommonProperty: true,
      },
    ],
    properties: [
      {
        _id: '32',
        label: 'Priority',
        name: 'priority',
        type: 'select',
        content: 'thesaurus2',
      },
    ],
  },
];

const thesauri: ClientThesaurus[] = [
  {
    _id: 'thesaurus1',
    name: 'Categories',
    values: [
      {
        id: 'cat1',
        label: 'Category 1',
        values: [
          {
            id: 'subcat1',
            label: 'Subcategory 1.1',
          },
          {
            id: 'subcat2',
            label: 'Subcategory 1.2',
          },
        ],
      },
      {
        id: 'cat2',
        label: 'Category 2',
        values: [
          {
            id: 'subcat3',
            label: 'Subcategory 2.1',
          },
        ],
      },
    ],
  },
  {
    _id: 'thesaurus2',
    name: 'Priorities',
    values: [
      {
        id: 'high',
        label: 'High',
      },
      {
        id: 'medium',
        label: 'Medium',
      },
      {
        id: 'low',
        label: 'Low',
      },
    ],
  },
];

export {
  updatedTranslation,
  currentTranslations,
  newLanguage,
  translationKeysChangeResult,
  translationKeysChangeArguments,
  templates,
  thesauri,
};
