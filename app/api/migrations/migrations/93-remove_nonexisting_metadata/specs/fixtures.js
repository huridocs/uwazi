import db from 'api/utils/testing_db';

const languages = [
  { key: 'en', label: 'English', default: true },
  { key: 'es', label: 'Spanish' },
  { key: 'pt', label: 'Portugal' },
];
const languageKeys = languages.map(l => l.key);

const createEntitiesInAllLanguages = (baseTitle, template, metadata) =>
  languageKeys.map(lKey => ({
    metadata,
    template,
    title: `${baseTitle}_${lKey}`,
    language: lKey,
    sharedId: `${baseTitle}-sharedId`,
  }));

const createCommonProps = () => [
  {
    _id: db.id(),
    label: 'Title',
    name: 'title',
    isCommonProperty: true,
    type: 'text',
    prioritySorting: false,
  },
  {
    _id: db.id(),
    label: 'Date added',
    name: 'creationDate',
    isCommonProperty: true,
    type: 'date',
    prioritySorting: false,
  },
  {
    _id: db.id(),
    label: 'Date modified',
    name: 'editDate',
    isCommonProperty: true,
    type: 'date',
    prioritySorting: false,
  },
];

const emptyTemplateId = db.id();
const templatesThatDoesNotExist = db.id();
const noExtraTemplateId = db.id();
const allHaveExtraTemplateId = db.id();
const mixedTemplateId = db.id();

const fixtures = {
  settings: [
    {
      _id: db.id(),
      site_name: 'Uwazi',
      languages,
    },
  ],
  templates: [
    {
      _id: emptyTemplateId,
      name: 'emptyTemplate',
      commonProperties: createCommonProps,
      properties: [],
      default: true,
    },
    {
      _id: noExtraTemplateId,
      name: 'noExtra',
      commonProperties: createCommonProps,
      properties: [
        {
          _id: db.id(),
          label: 'no_extra_text',
          name: 'no_extra_text',
          type: 'text',
        },
        {
          _id: db.id(),
          label: 'no_extra_number',
          name: 'no_extra_number',
          type: 'numeric',
        },
      ],
      default: true,
    },
    {
      _id: allHaveExtraTemplateId,
      name: 'allHaveExtra',
      commonProperties: createCommonProps,
      properties: [
        {
          _id: db.id(),
          label: 'all_extra_text',
          name: 'all_extra_text',
          type: 'text',
        },
        {
          _id: db.id(),
          label: 'all_extra_number',
          name: 'all_extra_number',
          type: 'numeric',
        },
      ],
      default: true,
    },
    {
      _id: mixedTemplateId,
      name: 'mixedCase',
      commonProperties: createCommonProps,
      properties: [
        {
          _id: db.id(),
          label: 'mixed_text',
          name: 'mixed_text',
          type: 'text',
        },
        {
          _id: db.id(),
          label: 'mixed_number',
          name: 'mixed_number',
          type: 'numeric',
        },
      ],
      default: true,
    },
  ],
  entities: [
    ...createEntitiesInAllLanguages('migrated_entity', templatesThatDoesNotExist, {
      test: [],
    }),
    ...createEntitiesInAllLanguages('empty_correct', emptyTemplateId, {}),
    ...createEntitiesInAllLanguages('empty_plusOne', emptyTemplateId, { extra1: [] }),
    ...createEntitiesInAllLanguages('empty_plusThree', emptyTemplateId, {
      extra1: [],
      extra2: [],
      extra3: [],
    }),
    ...createEntitiesInAllLanguages('no_extra_correct1', noExtraTemplateId, {
      no_extra_text: [],
      no_extra_number: [],
    }),
    ...createEntitiesInAllLanguages('no_extra_correct2', noExtraTemplateId, {
      no_extra_text: [],
      no_extra_number: [],
    }),
    ...createEntitiesInAllLanguages('all_extra_plusOne', allHaveExtraTemplateId, {
      all_extra_text: [],
      all_extra_number: [],
      extra1: [],
    }),
    ...createEntitiesInAllLanguages('all_extra_plusThree', allHaveExtraTemplateId, {
      all_extra_text: [],
      all_extra_number: [],
      extra1: [],
      extra2: [],
      extra3: [],
    }),
    ...createEntitiesInAllLanguages('mixed_correct', mixedTemplateId, {
      mixed_text: [],
      mixed_number: [],
    }),
    ...createEntitiesInAllLanguages('mixed_plusOne', mixedTemplateId, {
      mixed_text: [],
      mixed_number: [],
      extra1: [],
    }),
    ...createEntitiesInAllLanguages('mixed_plusThree', mixedTemplateId, {
      mixed_text: [],
      mixed_number: [],
      extra1: [],
      extra2: [],
      extra3: [],
    }),
  ],
};

export { fixtures, emptyTemplateId, noExtraTemplateId, allHaveExtraTemplateId, mixedTemplateId };
