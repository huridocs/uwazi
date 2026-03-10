import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture, testingDB } from 'api/utils/testing_db';

const entityTemplateId = '589af97080fc0b23471d67f3';
const documentTemplate = testingDB.id();
const dictionaryId = '589af97080fc0b23471d67f4';
const dictionaryIdToTranslate = '589af97080fc0b23471d67f5';
const dictionaryWithValueGroups = testingDB.id();
const dictionaryValueId = '1';

const createTranslationDBO = getFixturesFactory().v2.database.translationDBO;

const fixtures: DBFixture = {
  dictionaries: [
    { _id: testingDB.id(), name: 'dictionary' },
    {
      _id: testingDB.id(dictionaryId),
      name: 'dictionary 2',
      values: [
        { id: '1', label: 'value 1' },
        { id: '3', label: 'Parent', values: [{ id: '2', label: 'value 2' }] },
      ],
    },
    {
      _id: testingDB.id(dictionaryIdToTranslate),
      name: 'Top 2 scify books',
      values: [
        { id: dictionaryValueId, label: 'Enders game' },
        { id: '2', label: 'Fundation' },
      ],
    },
    {
      _id: dictionaryWithValueGroups,
      name: 'Top movies',
      values: [
        {
          id: '1',
          label: 'scy fi',
          values: [
            { id: '1.1', label: 'groundhog day' },
            { id: '1.2', label: 'terminator 2' },
          ],
        },
        {
          id: '2',
          label: 'superheros',
          values: [
            { id: '2.1', label: 'batman' },
            { id: '2.2', label: 'spiderman' },
          ],
        },
        { id: '3', label: 'single value' },
      ],
    },
  ],
  templates: [
    {
      _id: testingDB.id(entityTemplateId),
      name: 'entityTemplate',
      properties: [
        {
          type: 'multiselect',
          name: 'multiselect',
          content: dictionaryId,
        },
      ],
    },
    { _id: documentTemplate, name: 'documentTemplate', properties: [{}] },
  ],
  entities: [
    {
      _id: testingDB.id(),
      sharedId: 'sharedId2',
      language: 'es',
      template: testingDB.id(entityTemplateId),
      metadata: {
        multiselect: [{ value: '1', label: 'value 1' }],
      },
    },
    {
      _id: testingDB.id(),
      sharedId: 'sharedId',
      title: 'english entity',
      language: 'en',
      template: testingDB.id(entityTemplateId),
      icon: { type: 'Icon' },
      metadata: {
        multiselect: [{ value: '1', label: 'value 1' }],
      },
    },
    {
      _id: testingDB.id(),
      sharedId: 'sharedId',
      title: 'spanish entity',
      language: 'es',
      template: testingDB.id(entityTemplateId),
      icon: { type: 'Icon' },
      published: true,
      metadata: {
        multiselect: [
          { value: '1', label: 'value 1' },
          { value: '2', label: 'value 2', parent: { label: 'Parent', value: '3' } },
        ],
      },
    },
    {
      _id: testingDB.id(),
      sharedId: 'other',
      type: 'entity',
      title: 'unpublished entity',
      language: 'es',
      template: testingDB.id(entityTemplateId),
      published: false,
    },
    {
      _id: testingDB.id(),
      title: 'document',
      sharedId: 'documentSharedId',
      language: 'es',
      template: documentTemplate,
      published: true,
    },
    {
      _id: testingDB.id(),
      title: 'document 2',
      sharedId: 'documentSharedId 2',
      language: 'es',
      template: documentTemplate,
      published: true,
    },
  ],
  settings: [
    {
      _id: testingDB.id(),
      languages: [
        { key: 'es', label: 'ES', default: true },
        { key: 'en', label: 'English' },
      ],
    },
  ],
  translationsV2: [
    createTranslationDBO('Parent', 'Parent', 'en', {
      id: dictionaryId,
      type: 'Thesaurus',
      label: 'Dictionary',
    }),
    createTranslationDBO('value 2', 'value 2', 'en', {
      id: dictionaryId,
      type: 'Thesaurus',
      label: 'Dictionary',
    }),
    createTranslationDBO('value 1', 'value 1', 'en', {
      id: dictionaryId,
      type: 'Thesaurus',
      label: 'Dictionary',
    }),
    createTranslationDBO('dictionary 2', 'dictionary 2', 'en', {
      id: dictionaryId,
      type: 'Thesaurus',
      label: 'Dictionary',
    }),

    createTranslationDBO('Parent', 'Parent', 'es', {
      id: dictionaryId,
      type: 'Thesaurus',
      label: 'Dictionary',
    }),
    createTranslationDBO('value 2', 'value 2', 'es', {
      id: dictionaryId,
      type: 'Thesaurus',
      label: 'Dictionary',
    }),
    createTranslationDBO('value 1', 'value 1', 'es', {
      id: dictionaryId,
      type: 'Thesaurus',
      label: 'Dictionary',
    }),
    createTranslationDBO('dictionary 2', 'dictionary 2', 'es', {
      id: dictionaryId,
      type: 'Thesaurus',
      label: 'Dictionary',
    }),
  ],
};

export {
  fixtures,
  dictionaryId,
  dictionaryIdToTranslate,
  dictionaryValueId,
  dictionaryWithValueGroups,
};
