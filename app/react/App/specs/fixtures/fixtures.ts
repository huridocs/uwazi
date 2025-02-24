import { ClientTranslationSchema } from 'app/istore';

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

export {
  updatedTranslation,
  currentTranslations,
  newLanguage,
  translationKeysChangeResult,
  translationKeysChangeArguments,
};
