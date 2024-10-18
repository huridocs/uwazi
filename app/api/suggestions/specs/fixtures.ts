/* eslint-disable max-lines */
import _ from 'lodash';

import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingDB, DBFixture } from 'api/utils/testing_db';

const factory = getFixturesFactory();

const suggestionId = testingDB.id();

const shared2esId = testingDB.id();
const shared2enId = testingDB.id();
const shared6enId = testingDB.id();

const personTemplateId = factory.id('personTemplate');
const heroTemplateId = factory.id('heroTemplate');

const suggestionSharedId6Title = testingDB.id();
const suggestionSharedId6Enemy = testingDB.id();
const suggestionSharedId6EnemyEs = testingDB.id();

const shared2AgeSuggestionId = testingDB.id();

const file2Id = factory.id('F2');
const file3Id = factory.id('F3');

const ixSettings = [
  {
    languages: [
      {
        default: true,
        key: 'en' as 'en',
        label: 'English',
      },
      {
        key: 'es' as 'es',
        label: 'Spanish',
      },
    ],
    features: {
      metadataExtraction: {
        url: 'https://metadataextraction.com',
      },
    },
  },
];

const dictionaryTranslationContext = factory.v2.database.nestedTranslationContextDBO(
  'Nested Thesaurus',
  'Thesaurus'
);

const fixtures: DBFixture = {
  settings: _.cloneDeep(ixSettings),
  ixextractors: [
    factory.ixExtractor('age_extractor', 'age', ['personTemplate', 'heroTemplate', 'template1']),
    factory.ixExtractor('title_extractor', 'title', ['heroTemplate']),
    factory.ixExtractor('super_powers_extractor', 'super_powers', ['personTemplate', 'template1']),
    factory.ixExtractor('enemy_extractor', 'enemy', ['personTemplate', 'heroTemplate']),
    factory.ixExtractor('first_encountered_extractor', 'first_encountered', ['heroTemplate']),
    factory.ixExtractor('select_extractor', 'property_select', ['templateWithSelects']),
    factory.ixExtractor('multiselect_extractor', 'property_multiselect', ['templateWithSelects']),
  ],
  ixmodels: [
    {
      _id: testingDB.id(),
      status: 'ready',
      creationDate: 1000,
      extractorId: factory.id('age_extractor'),
    },
    {
      _id: testingDB.id(),
      status: 'ready',
      creationDate: 1,
      extractorId: factory.id('title_extractor'),
    },
    {
      _id: testingDB.id(),
      status: 'ready',
      creationDate: 1,
      extractorId: factory.id('super_powers_extractor'),
    },
    {
      _id: testingDB.id(),
      status: 'ready',
      creationDate: 1,
      extractorId: factory.id('enemy_extractor'),
    },
    {
      _id: testingDB.id(),
      status: 'ready',
      creationDate: 1,
      extractorId: factory.id('first_encountered_extractor'),
    },
    {
      _id: testingDB.id(),
      status: 'ready',
      creationDate: 1,
      extractorId: factory.id('select_extractor'),
    },
    {
      _id: testingDB.id(),
      status: 'ready',
      creationDate: 1,
      extractorId: factory.id('multiselect_extractor'),
    },
  ],
  ixsuggestions: [
    {
      entityId: 'shared1',
      entityTemplate: personTemplateId.toString(),
      propertyName: 'title',
      extractorId: factory.id('title_extractor'),
      suggestedValue: 'Red Robin',
      segment: 'Red Robin, a variation on the traditional Robin persona.',
      language: 'en',
      date: 5,
      page: 2,
      status: 'ready',
      error: '',
    },
    {
      entityId: 'shared1',
      entityTemplate: personTemplateId.toString(),
      propertyName: 'enemy',
      extractorId: factory.id('enemy_extractor'),
      suggestedValue: 'Red Robin',
      segment: 'Red Robin, a variation on the traditional Robin persona.',
      language: 'en',
      date: 5,
      page: 2,
      status: 'ready',
      error: '',
    },
    {
      entityId: 'shared1',
      entityTemplate: personTemplateId.toString(),
      propertyName: 'title',
      extractorId: factory.id('title_extractor'),
      suggestedValue: 'HCT-04-CR-SC-0074',
      segment: 'Robin Rojo, una variante del Robin tradicional',
      language: 'es',
      date: 5,
      page: 2,
      status: 'ready',
      error: '',
    },
    {
      entityId: 'shared1',
      fileId: factory.id('F1'),
      entityTemplate: personTemplateId.toString(),
      propertyName: 'age',
      extractorId: factory.id('age_extractor'),
      suggestedValue: '17',
      segment: 'Robin is 17.',
      language: 'en',
      date: 5,
      page: 2,
      status: 'ready',
      error: '',
    },
    {
      entityId: 'shared2',
      entityTemplate: personTemplateId.toString(),
      propertyName: 'super_powers',
      extractorId: factory.id('super_powers_extractor'),
      suggestedValue: 'NOT_READY',
      segment: 'Red Robin, a variation on the traditional Robin persona.',
      language: 'en',
      date: 2,
      page: 3,
      status: 'processing',
      error: '',
    },
    {
      fileId: factory.id('F2'),
      entityId: 'shared2',
      entityTemplate: personTemplateId.toString(),
      propertyName: 'super_powers',
      extractorId: factory.id('super_powers_extractor'),
      suggestedValue: 'scientific knowledge',
      segment: 'he relies on his own scientific knowledge',
      language: 'en',
      date: 4,
      page: 5,
      status: 'ready',
      error: '',
    },
    {
      _id: shared2AgeSuggestionId,
      fileId: factory.id('F2'),
      entityId: 'shared2',
      entityTemplate: personTemplateId.toString(),
      propertyName: 'age',
      extractorId: factory.id('age_extractor'),
      suggestedValue: '20',
      segment: 'is aged 20',
      language: 'en',
      date: 4,
      page: 5,
      status: 'ready',
      error: '',
    },
    {
      _id: suggestionId,
      fileId: factory.id('F3'),
      entityId: 'shared2',
      entityTemplate: personTemplateId.toString(),
      propertyName: 'super_powers',
      extractorId: factory.id('super_powers_extractor'),
      suggestedValue: 'scientific knowledge es',
      segment: 'el confía en su propio conocimiento científico',
      language: 'es',
      date: 4,
      page: 5,
      status: 'ready',
      error: '',
    },
    {
      entityId: 'shared3',
      entityTemplate: personTemplateId.toString(),
      propertyName: 'title',
      extractorId: factory.id('title_extractor'),
      suggestedValue: 'Alfred Pennyworth',
      segment: "Batman's butler, Alfred Pennyworth",
      language: 'en',
      date: 4,
      page: 3,
      status: 'ready',
      error: '',
    },
    {
      entityId: 'shared3',
      entityTemplate: personTemplateId.toString(),
      propertyName: 'age',
      extractorId: factory.id('age_extractor'),
      suggestedValue: '',
      segment: 'Alfred 67 years old',
      language: 'en',
      date: 4000,
      page: 3,
      status: 'ready',
      error: '',
    },
    {
      entityId: 'shared3',
      fileId: factory.id('F7'),
      entityTemplate: personTemplateId.toString(),
      propertyName: 'super_powers',
      extractorId: factory.id('super_powers_extractor'),
      suggestedValue: 'puts up with Bruce Wayne',
      segment: 'he puts up with Bruce Wayne',
      language: 'en',
      date: 4000,
      page: 3,
      status: 'ready',
      error: '',
    },
    {
      entityId: 'shared4',
      entityTemplate: personTemplateId.toString(),
      propertyName: 'title',
      extractorId: factory.id('title_extractor'),
      suggestedValue: 'Joker',
      segment: ' Joker is a homicidal psychopath',
      language: 'en',
      date: 3,
      page: 1,
      status: 'ready',
      error: '',
    },
    {
      entityId: 'shared4',
      entityTemplate: personTemplateId.toString(),
      propertyName: 'age',
      extractorId: factory.id('age_extractor'),
      suggestedValue: null,
      segment: 'Joker age is 45',
      language: 'en',
      date: 4,
      page: 3,
      status: 'failed',
      error: 'This has an error',
    },
    {
      entityId: 'shared3',
      entityTemplate: personTemplateId.toString(),
      propertyName: 'age',
      extractorId: factory.id('age_extractor'),
      suggestedValue: 24,
      segment: 'Alfred 67 years old processing',
      language: 'en',
      date: 3000,
      page: 4,
      status: 'processing',
      error: '',
    },
    {
      entityId: 'shared5',
      entityTemplate: heroTemplateId.toString(),
      propertyName: 'title',
      extractorId: factory.id('title_extractor'),
      fileId: factory.id('Fshared5').toString(),
      suggestedValue: 'Poison Ivy',
      segment: 'Poison Ivy is a fictional character appearing in comic books',
      language: 'en',
      date: 6,
      page: 2,
      status: 'ready',
      error: '',
    },
    {
      entityId: 'shared5',
      entityTemplate: heroTemplateId.toString(),
      propertyName: 'age',
      extractorId: factory.id('age_extractor'),
      fileId: factory.id('Fshared5').toString(),
      suggestedValue: 25,
      segment: 'Poison Ivy 45 years old',
      language: 'en',
      date: 4,
      page: 3,
      status: 'ready',
      error: '',
    },
    {
      _id: suggestionSharedId6Title,
      entityId: 'shared6',
      entityTemplate: heroTemplateId.toString(),
      propertyName: 'title',
      extractorId: factory.id('title_extractor'),
      suggestedValue: 'Penguin',
      segment: 'The Penguin is a Gotham City mobster.',
      language: 'en',
      date: 2,
      page: 12,
      status: 'ready',
      error: '',
    },
    {
      _id: suggestionSharedId6Enemy,
      entityId: 'shared6',
      entityTemplate: heroTemplateId.toString(),
      propertyName: 'enemy',
      extractorId: factory.id('enemy_extractor'),
      suggestedValue: 'Batman',
      segment: 'Enemy: Batman',
      language: 'en',
      date: 5,
      page: 3,
      status: 'ready',
      error: '',
    },
    {
      _id: suggestionSharedId6EnemyEs,
      fileId: factory.id('F4'),
      entityId: 'shared6',
      entityTemplate: heroTemplateId.toString(),
      propertyName: 'enemy',
      extractorId: factory.id('enemy_extractor'),
      suggestedValue: '',
      segment: 'Enemy: Batman',
      language: 'es',
      date: 5,
      page: 3,
      status: 'ready',
      error: '',
    },
    {
      fileId: factory.id('F4'),
      _id: testingDB.id(),
      entityId: 'shared6',
      entityTemplate: heroTemplateId.toString(),
      propertyName: 'enemy',
      extractorId: factory.id('enemy_extractor'),
      suggestedValue: '',
      segment: 'Enemy: Batman',
      language: 'en',
      date: 5,
      page: 3,
      status: 'ready',
      error: '',
    },
    {
      fileId: factory.id('F5'),
      _id: testingDB.id(),
      entityId: 'shared7',
      entityTemplate: heroTemplateId.toString(),
      propertyName: 'first_encountered',
      extractorId: factory.id('first_encountered_extractor'),
      suggestedValue: '',
      segment: 'Some text',
      language: 'en',
      date: 5,
      page: 1,
      status: 'ready',
      error: '',
    },
    {
      fileId: factory.id('F5'),
      _id: testingDB.id(),
      entityId: 'shared7',
      entityTemplate: heroTemplateId.toString(),
      propertyName: 'first_encountered',
      extractorId: factory.id('first_encountered_extractor'),
      suggestedValue: 1654732800,
      segment: 'Some text',
      language: 'es',
      date: 5,
      page: 1,
      status: 'ready',
      error: '',
    },
    {
      fileId: factory.id('F5'),
      _id: testingDB.id(),
      entityId: 'shared7',
      entityTemplate: heroTemplateId.toString(),
      propertyName: 'first_encountered',
      extractorId: factory.id('first_encountered_extractor'),
      suggestedValue: 1234,
      segment: 'Some text',
      language: 'pr',
      date: 5,
      page: 1,
      status: 'ready',
      error: '',
    },
    {
      fileId: factory.id('F6'),
      _id: testingDB.id(),
      entityId: 'shared8',
      entityTemplate: heroTemplateId.toString(),
      propertyName: 'first_encountered',
      extractorId: factory.id('first_encountered_extractor'),
      suggestedValue: 1654732800,
      segment: 'Some text',
      language: 'en',
      date: 5,
      page: 1,
      status: 'ready',
      error: '',
    },
    {
      fileId: factory.id('F6'),
      _id: testingDB.id(),
      entityId: 'shared8',
      entityTemplate: heroTemplateId.toString(),
      propertyName: 'enemy',
      extractorId: factory.id('enemy_extractor'),
      suggestedValue: '',
      segment: 'Some text',
      language: 'en',
      date: 5,
      page: 1,
      status: 'ready',
      error: '',
    },
    {
      fileId: factory.id('F8'),
      _id: testingDB.id(),
      entityId: 'shared9',
      entityTemplate: heroTemplateId.toString(),
      propertyName: 'enemy',
      extractorId: factory.id('enemy_extractor'),
      suggestedValue: 'Some text',
      segment: 'Some text',
      language: 'en',
      date: 5,
      page: 1,
      status: 'ready',
      error: '',
    },
    {
      fileId: factory.id('fileForentityWithSelects'),
      entityId: 'entityWithSelects',
      entityTemplate: factory.id('templateWithSelects').toString(),
      propertyName: 'property_select',
      extractorId: factory.id('select_extractor'),
      suggestedValue: '1B',
      language: 'en',
      date: 5,
      status: 'ready',
      error: '',
    },
    {
      fileId: factory.id('fileForentityWithSelects'),
      entityId: 'entityWithSelects',
      entityTemplate: factory.id('templateWithSelects').toString(),
      propertyName: 'property_multiselect',
      extractorId: factory.id('multiselect_extractor'),
      suggestedValue: ['A', '1A'],
      language: 'en',
      date: 5,
      status: 'ready',
      error: '',
    },
    {
      fileId: factory.id('fileForentityWithSelects2'),
      entityId: 'entityWithSelects2',
      entityTemplate: factory.id('templateWithSelects').toString(),
      propertyName: 'property_select',
      extractorId: factory.id('select_extractor'),
      suggestedValue: 'A',
      language: 'en',
      date: 5,
      status: 'ready',
      error: '',
    },
    {
      _id: factory.id('multiSelectSuggestion2'),
      fileId: factory.id('fileForentityWithSelects2'),
      entityId: 'entityWithSelects2',
      entityTemplate: factory.id('templateWithSelects').toString(),
      propertyName: 'property_multiselect',
      extractorId: factory.id('multiselect_extractor'),
      suggestedValue: ['A', '1B'],
      language: 'en',
      date: 5,
      status: 'ready',
      error: '',
    },
    {
      fileId: factory.id('fileForentityWithSelects3'),
      entityId: 'entityWithSelects3',
      entityTemplate: factory.id('templateWithSelects').toString(),
      propertyName: 'property_select',
      extractorId: factory.id('select_extractor'),
      suggestedValue: 'A',
      language: 'en',
      date: 5,
      status: 'ready',
      error: '',
    },
    {
      fileId: factory.id('fileForentityWithSelects3'),
      entityId: 'entityWithSelects3',
      entityTemplate: factory.id('templateWithSelects').toString(),
      propertyName: 'property_multiselect',
      extractorId: factory.id('multiselect_extractor'),
      suggestedValue: ['A', '1A'],
      language: 'en',
      date: 5,
      status: 'ready',
      error: '',
    },
  ],
  entities: [
    {
      _id: testingDB.id(),
      sharedId: 'shared1',
      title: 'Robin',
      language: 'en',
      metadata: { enemy: [{ value: 'Red Robin' }], age: [{ value: 99 }] },
      template: personTemplateId,
    },
    {
      _id: testingDB.id(),
      sharedId: 'shared1',
      title: 'Robin es',
      language: 'es',
      template: personTemplateId,
      metadata: { age: [{ value: 99 }] },
    },
    {
      _id: testingDB.id(),
      sharedId: 'shared2',
      title: 'Batman ar',
      language: 'ar',
      metadata: { super_powers: [{ value: 'scientific knowledge' }], age: [{ value: 12 }] },
      template: personTemplateId,
    },
    {
      _id: shared2enId,
      sharedId: 'shared2',
      title: 'Batman en',
      language: 'en',
      metadata: { super_powers: [{ value: 'scientific knowledge' }], age: [{ value: 12 }] },
      template: personTemplateId,
    },
    {
      _id: shared2esId,
      sharedId: 'shared2',
      title: 'Batman es',
      language: 'es',
      metadata: { super_powers: [{ value: 'conocimiento científico' }], age: [{ value: 12 }] },
      template: personTemplateId,
    },
    {
      _id: factory.id('Alfred-english-entity'),
      sharedId: 'shared3',
      title: 'Alfred',
      language: 'en',
      metadata: { age: [{ value: 23 }], super_powers: [{ value: 'no super powers' }] },
      template: personTemplateId,
    },
    {
      _id: testingDB.id(),
      sharedId: 'shared4',
      title: 'Joker',
      language: 'en',
      template: personTemplateId,
    },
    {
      _id: testingDB.id(),
      sharedId: 'shared5',
      title: 'Poison Ivy',
      language: 'en',
      metadata: { age: [{ value: 34 }] },
      template: heroTemplateId,
    },
    {
      _id: testingDB.id(),
      sharedId: 'shared6',
      title: 'The Penguin',
      language: 'es',
      metadata: { enemy: [{ value: '' }], age: [{ value: 40 }] },
      template: heroTemplateId,
    },
    {
      _id: shared6enId,
      sharedId: 'shared6',
      title: 'The Penguin',
      language: 'pr',
      metadata: { enemy: [{ value: '' }], age: [{ value: 40 }] },
      template: heroTemplateId,
    },
    {
      _id: testingDB.id(),
      sharedId: 'shared6',
      title: 'The Penguin',
      language: 'en',
      metadata: { enemy: [{ value: 'Penguin Enemy' }], age: [{ value: 40 }] },
      template: heroTemplateId,
    },
    {
      _id: testingDB.id(),
      sharedId: 'shared7',
      title: 'The Riddler',
      language: 'en',
      metadata: {
        first_encountered: [{ value: 1654732800 }],
      },
      template: heroTemplateId,
    },
    {
      _id: testingDB.id(),
      sharedId: 'shared7',
      title: 'The Riddler',
      language: 'es',
      metadata: { first_encountered: [{ value: 1654732800 }] },
      template: heroTemplateId,
    },
    {
      _id: testingDB.id(),
      sharedId: 'shared7',
      title: 'The Riddler',
      language: 'pr',
      metadata: { first_encountered: [{ value: 1654732800 }] },
      template: heroTemplateId,
    },
    {
      _id: testingDB.id(),
      sharedId: 'shared8',
      title: 'Catwoman',
      language: 'en',
      metadata: { first_encountered: [{ value: 1654732800 }] },
      template: heroTemplateId,
    },
    {
      _id: testingDB.id(),
      sharedId: 'shared9',
      title: 'Catwoman 2',
      language: 'en',
      metadata: {},
      template: heroTemplateId,
    },
    {
      _id: factory.id('entityWithSelects'),
      template: factory.id('templateWithSelects'),
      sharedId: 'entityWithSelects',
      title: 'entityWithSelects',
      language: 'en',
      metadata: {
        property_select: [{ value: '1B', label: '1B' }],
        property_multiselect: [
          { value: 'A', label: 'A' },
          { value: '1A', label: '1A' },
        ],
      },
    },
    {
      _id: factory.id('entityWithSelects2'),
      template: factory.id('templateWithSelects'),
      sharedId: 'entityWithSelects2',
      title: 'entityWithSelects2',
      language: 'en',
      metadata: {
        property_select: [{ value: '1B', label: '1B' }],
        property_multiselect: [
          { value: 'A', label: 'A' },
          { value: '1A', label: '1A' },
        ],
      },
    },
    {
      _id: testingDB.id(),
      template: factory.id('templateWithSelects'),
      sharedId: 'entityWithSelects3',
      title: 'entityWithSelects3',
      language: 'en',
      metadata: {
        property_select: [],
        property_multiselect: [],
      },
    },
  ],
  files: [
    factory.fileDeprecated('F1', 'shared1', 'document', 'documentRedRobin.pdf', 'eng', '', [
      {
        name: 'age',
        selection: {
          text: '99',
          selectionRectangles: [{ top: 0, left: 0, width: 1, height: 2, page: '2' }],
        },
      },
    ]),
    factory.fileDeprecated('F2', 'shared2', 'document', 'documentB.pdf', 'eng', '', [
      {
        name: 'super_powers',
        selection: {
          text: 'scientific knowledge',
          selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
        },
      },
      {
        name: 'age',
        selection: {
          text: '20',
          selectionRectangles: [{ top: 0, left: 0, width: 1, height: 2, page: '2' }],
        },
      },
    ]),
    factory.fileDeprecated('F3', 'shared2', 'document', 'documentC.pdf', 'spa', '', [
      {
        name: 'super_powers',
        selection: {
          text: 'conocimiento científico',
          selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
        },
      },
    ]),
    factory.fileDeprecated('Fshared5', 'shared5', 'document', 'documentPoisonIvy.pdf', 'eng', '', [
      {
        name: 'enemy',
        selection: {
          text: 'Poison Ivy',
          selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
        },
      },
    ]),
    factory.fileDeprecated('F4', 'shared6', 'document', 'documentD.pdf', 'eng', '', [
      {
        name: 'enemy',
        selection: {
          text: 'Penguin Enemy',
          selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
        },
      },
    ]),
    factory.fileDeprecated('F5', 'shared7', 'document', 'documentRiddler.pdf', 'eng', '', [
      {
        name: 'first_encountered',
        selection: {
          text: 'Jun 9, 2022',
          selectionRectangles: [
            {
              top: 0,
              left: 0,
              width: 0,
              height: 0,
              page: '1',
            },
          ],
        },
      },
    ]),
    factory.fileDeprecated('F6', 'shared8', 'document', 'documentRiddler.pdf', 'eng', '', []),
    factory.fileDeprecated('F7', 'shared3', 'document', 'documentAlfred.pdf', 'eng', '', [
      {
        name: 'super_powers',
        selection: {
          text: 'no super powers',
          selectionRectangles: [
            {
              top: 0,
              left: 0,
              width: 0,
              height: 0,
              page: '1',
            },
          ],
        },
      },
    ]),
    factory.fileDeprecated(
      'fileForentityWithSelects',
      'entityWithSelects',
      'document',
      'documentWithSelects.pdf',
      'eng',
      'documentWithSelects.pdf'
    ),
    factory.fileDeprecated(
      'fileForentityWithSelects2',
      'entityWithSelects2',
      'document',
      'documentWithSelects2.pdf',
      'eng',
      'documentWithSelects2.pdf'
    ),
    factory.fileDeprecated(
      'fileForentityWithSelects3',
      'entityWithSelects3',
      'document',
      'documentWithSelects3.pdf',
      'eng',
      'documentWithSelects3.pdf'
    ),
  ],
  dictionaries: [factory.nestedThesauri('Nested Thesaurus', ['A', { 1: ['1A', '1B'] }])],
  templates: [
    {
      _id: personTemplateId,
      properties: [
        {
          label: 'Age',
          type: 'numeric',
          name: 'age',
        },
        {
          label: 'Enemy',
          type: 'text',
          name: 'enemy',
        },
        {
          label: 'Super powers',
          type: 'text',
          name: 'super_powers',
        },
      ],
    },
    {
      _id: heroTemplateId,
      commonProperties: [{ label: 'Title', type: 'text', name: 'title' }],
      properties: [
        {
          label: 'Age',
          type: 'numeric',
          name: 'age',
        },
        {
          label: 'Enemy',
          type: 'text',
          name: 'enemy',
        },
        {
          label: 'First Encountered',
          type: 'date',
          name: 'first_encountered',
        },
      ],
    },
    {
      _id: factory.id('template1'),
      properties: [
        {
          label: 'Super powers',
          type: 'text',
          name: 'super_powers',
        },
        {
          label: 'Age',
          type: 'numeric',
          name: 'age',
        },
      ],
    },
    factory.template('templateWithSelects', [
      factory.property('property_select', 'select', {
        content: factory.id('Nested Thesaurus').toString(),
      }),
      factory.property('property_multiselect', 'multiselect', {
        content: factory.id('Nested Thesaurus').toString(),
      }),
    ]),
  ],
  segmentations: [
    {
      _id: factory.id('S1'),
      fileID: factory.id('F2'),
      filename: 'documentC.pdf',
      status: 'failed',
    },
    {
      _id: factory.id('S2'),
      fileID: factory.id('F3'),
      filename: 'documentC.pdf',
      status: 'ready',
    },
  ],
  translationsV2: [
    factory.v2.database.translationDBO(
      'Nested Thesaurus',
      'Nested Thesaurus',
      'en',
      dictionaryTranslationContext
    ),
    factory.v2.database.translationDBO(
      'Nested Thesaurus',
      'Nested Thesaurus Es',
      'es',
      dictionaryTranslationContext
    ),
    factory.v2.database.translationDBO('A', 'A', 'en', dictionaryTranslationContext),
    factory.v2.database.translationDBO('A', 'Aes', 'es', dictionaryTranslationContext),
    factory.v2.database.translationDBO('1A', '1A', 'en', dictionaryTranslationContext),
    factory.v2.database.translationDBO('1A', '1Aes', 'es', dictionaryTranslationContext),
    factory.v2.database.translationDBO('1B', '1B', 'en', dictionaryTranslationContext),
    factory.v2.database.translationDBO('1B', '1Bes', 'es', dictionaryTranslationContext),
  ],
};

const stateFilterFixtures: DBFixture = {
  settings: _.cloneDeep(ixSettings),
  templates: [
    factory.template('template1', [
      factory.property('testprop', 'text'),
      factory.property('unusedprop', 'text'),
    ]),
  ],
  entities: [
    ...factory.entityInMultipleLanguages(['es', 'en'], 'labeled-match', 'template1', {
      testprop: [{ value: 'test-labeled-match' }],
    }),
    ...factory.entityInMultipleLanguages(['es', 'en'], 'labeled-mismatch', 'template1', {
      testprop: [{ value: 'test-labeled-mismatch' }],
    }),
    ...factory.entityInMultipleLanguages(['es', 'en'], 'unlabeled-no-suggestion', 'template1', {
      testprop: [{ value: 'test-unlabeled-no-suggestion' }],
    }),
    ...factory.entityInMultipleLanguages(['es', 'en'], 'unlabeled-no-context', 'template1', {
      testprop: [{ value: 'test-unlabeled-no-context' }],
    }),
    ...factory.entityInMultipleLanguages(['es', 'en'], 'unlabeled-obsolete', 'template1', {
      testprop: [{ value: 'test-unlabeled-obsolete' }],
    }),
    ...factory.entityInMultipleLanguages(['es', 'en'], 'unlabeled-processing', 'template1', {
      testprop: [{ value: 'test-unlabeled-processing' }],
    }),
    ...factory.entityInMultipleLanguages(['es', 'en'], 'unlabeled-error', 'template1', {
      testprop: [{ value: 'test-unlabeled-error' }],
    }),
  ],
  files: [
    factory.fileDeprecated(
      'label-match-file-en',
      'labeled-match',
      'document',
      'lmfen.pdf',
      'en',
      undefined,
      [factory.fileExtractedMetadata('testprop', 'test-labeled-match')]
    ),
    factory.fileDeprecated(
      'label-match-file-es',
      'labeled-match',
      'document',
      'lmfes.pdf',
      'es',
      undefined,
      [factory.fileExtractedMetadata('testprop', 'test-labeled-match')]
    ),
    factory.fileDeprecated(
      'label-mismatch-file-en',
      'labeled-mismatch',
      'document',
      'lmismfen.pdf',
      'en',
      undefined,
      [factory.fileExtractedMetadata('testprop', 'test-labeled-mismatch')]
    ),
    factory.fileDeprecated(
      'label-mismatch-file-es',
      'labeled-mismatch',
      'document',
      'lmismfes.pdf',
      'es',
      undefined,
      [factory.fileExtractedMetadata('testprop', 'test-labeled-mismatch')]
    ),
    factory.fileDeprecated(
      'unlabeled-no-suggestion-file-en',
      'unlabeled-no-suggestion',
      'document',
      'unslfen.pdf',
      'en',
      undefined
    ),
    factory.fileDeprecated(
      'unlabeled-no-suggestion-file-es',
      'unlabeled-no-suggestion',
      'document',
      'unslfes.pdf',
      'es',
      undefined
    ),
    factory.fileDeprecated(
      'unlabeled-no-context-file-en',
      'unlabeled-no-context',
      'document',
      'unlcen.pdf',
      'en',
      undefined
    ),
    factory.fileDeprecated(
      'unlabeled-no-context-file-es',
      'unlabeled-no-context',
      'document',
      'unlces.pdf',
      'es',
      undefined
    ),
    factory.fileDeprecated(
      'unlabeled-obsolete-file-en',
      'unlabeled-obsolete',
      'document',
      'unloen.pdf',
      'en',
      undefined
    ),
    factory.fileDeprecated(
      'unlabeled-obsolete-file-es',
      'unlabeled-obsolete',
      'document',
      'unloes.pdf',
      'es',
      undefined
    ),
    factory.fileDeprecated(
      'unlabeled-others-file-en',
      'unlabeled-others',
      'document',
      'unlothen.pdf',
      'en',
      undefined
    ),
    factory.fileDeprecated(
      'unlabeled-others-file-es',
      'unlabeled-others',
      'document',
      'unlotes.pdf',
      'es',
      undefined
    ),
    factory.fileDeprecated(
      'unlabeled-processing-file-en',
      'unlabeled-processing',
      'document',
      'unlpen.pdf',
      'en',
      undefined
    ),
    factory.fileDeprecated(
      'unlabeled-processing-file-es',
      'unlabeled-processing',
      'document',
      'unlpes.pdf',
      'es',
      undefined
    ),
    factory.fileDeprecated(
      'unlabeled-error-file-en',
      'unlabeled-error',
      'document',
      'unleen.pdf',
      'en',
      undefined
    ),
    factory.fileDeprecated(
      'unlabeled-error-file-es',
      'unlabeled-error',
      'document',
      'unlees.pdf',
      'es',
      undefined
    ),
  ],
  ixmodels: [factory.ixModel('test_model', 'test_extractor', 1000)],
  ixextractors: [
    factory.ixExtractor('test_extractor', 'testprop', ['template1']),
    factory.ixExtractor('unused_extractor', 'unused_prop', ['template1']),
  ],
  ixsuggestions: [
    factory.ixSuggestion_deprecated(
      'label-match-suggestion-en',
      'test_extractor',
      'labeled-match',
      'template1',
      'label-match-file-en',
      'testprop',
      {
        status: 'ready',
        date: 1001,
        language: 'en',
        suggestedValue: 'test-labeled-match',
      }
    ),
    factory.ixSuggestion_deprecated(
      'label-match-suggestion-es',
      'test_extractor',
      'labeled-match',
      'template1',
      'label-match-file-es',
      'testprop',
      {
        status: 'ready',
        date: 1001,
        language: 'es',
        suggestedValue: 'test-labeled-match',
      }
    ),
    factory.ixSuggestion_deprecated(
      'label-mismatch-suggestion-en',
      'test_extractor',
      'labeled-mismatch',
      'template1',
      'label-mismatch-file-en',
      'testprop',
      {
        status: 'ready',
        date: 1001,
        language: 'en',
        suggestedValue: 'test-labeled-mismatch-mismatch',
      }
    ),
    factory.ixSuggestion_deprecated(
      'label-mismatch-suggestion-es',
      'test_extractor',
      'labeled-mismatch',
      'template1',
      'label-mismatch-file-es',
      'testprop',
      {
        status: 'ready',
        date: 1001,
        language: 'es',
        suggestedValue: 'test-labeled-mismatch-mismatch',
      }
    ),
    factory.ixSuggestion_deprecated(
      'unlabeled-no-suggestion-suggestion-en',
      'test_extractor',
      'unlabeled-no-suggestion',
      'template1',
      'unlabeled-no-suggestion-file-en',
      'testprop',
      {
        status: 'ready',
        date: 1001,
        language: 'en',
        suggestedValue: '',
      }
    ),
    factory.ixSuggestion_deprecated(
      'unlabeled-no-suggestion-suggestion-es',
      'test_extractor',
      'unlabeled-no-suggestion',
      'template1',
      'unlabeled-no-suggestion-file-es',
      'testprop',
      {
        status: 'ready',
        date: 1001,
        language: 'es',
        suggestedValue: '',
      }
    ),
    factory.ixSuggestion_deprecated(
      'unlabeled-no-context-suggestion-en',
      'test_extractor',
      'unlabeled-no-context',
      'template1',
      'unlabeled-no-context-file-en',
      'testprop',
      {
        status: 'ready',
        date: 1001,
        language: 'en',
        suggestedValue: 'test-unlabeled-no-context',
      }
    ),
    factory.ixSuggestion_deprecated(
      'unlabeled-no-context-suggestion-es',
      'test_extractor',
      'unlabeled-no-context',
      'template1',
      'unlabeled-no-context-file-es',
      'testprop',
      {
        status: 'ready',
        date: 1001,
        language: 'es',
        suggestedValue: 'test-unlabeled-no-context',
      }
    ),
    factory.ixSuggestion_deprecated(
      'unlabeled-obsolete-suggestion-en',
      'test_extractor',
      'unlabeled-obsolete',
      'template1',
      'unlabeled-obsolete-file-en',
      'testprop',
      {
        status: 'ready',
        date: 999,
        language: 'en',
        suggestedValue: 'test-unlabeled-obsolete',
        segment: 'test-unlabeled-obsolete',
      }
    ),
    factory.ixSuggestion_deprecated(
      'unlabeled-obsolete-suggestion-es',
      'test_extractor',
      'unlabeled-obsolete',
      'template1',
      'unlabeled-obsolete-file-es',
      'testprop',
      {
        status: 'ready',
        date: 999,
        language: 'es',
        suggestedValue: 'test-unlabeled-obsolete',
        segment: 'test-unlabeled-obsolete',
      }
    ),
    factory.ixSuggestion_deprecated(
      'unlabeled-processing-suggestion-en',
      'test_extractor',
      'unlabeled-processing',
      'template1',
      'unlabeled-processing-file-en',
      'testprop',
      {
        status: 'processing',
        date: 1001,
        language: 'en',
        suggestedValue: 'test-unlabeled-processing',
        segment: 'test-unlabeled-processing',
      }
    ),
    factory.ixSuggestion_deprecated(
      'unlabeled-processing-suggestion-es',
      'test_extractor',
      'unlabeled-processing',
      'template1',
      'unlabeled-processing-file-es',
      'testprop',
      {
        status: 'processing',
        date: 1001,
        language: 'es',
        suggestedValue: 'test-unlabeled-processing',
        segment: 'test-unlabeled-processing',
      }
    ),
    factory.ixSuggestion_deprecated(
      'unlabeled-error-suggestion-en',
      'test_extractor',
      'unlabeled-error',
      'template1',
      'unlabeled-error-file-en',
      'testprop',
      {
        status: 'failed',
        date: 1001,
        language: 'en',
        suggestedValue: 'test-unlabeled-error',
        segment: 'test-unlabeled-error',
        error: 'some error happened',
      }
    ),
    factory.ixSuggestion_deprecated(
      'unlabeled-error-suggestion-es',
      'test_extractor',
      'unlabeled-error',
      'template1',
      'unlabeled-error-file-es',
      'testprop',
      {
        status: 'failed',
        date: 1001,
        language: 'es',
        suggestedValue: 'test-unlabeled-error',
        segment: 'test-unlabeled-error',
        error: 'some error happened',
      }
    ),
    factory.ixSuggestion_deprecated(
      'unusedsuggestion',
      'unused_extractor',
      'unused',
      'template1',
      'unused-file',
      'unusedprop',
      {
        status: 'ready',
        date: 1001,
        language: 'en',
        suggestedValue: 'test-unused',
      }
    ),
    factory.ixSuggestion({
      extractorId: factory.id('unused_extractor'),
      state: {
        labeled: true,
        match: true,
        obsolete: true,
        error: true,
      },
    }),
  ],
};

const selectAcceptanceFixtureBase: DBFixture = {
  settings: _.cloneDeep(ixSettings),
  ixextractors: [
    factory.ixExtractor('select_extractor', 'property_select', ['templateWithSelects']),
    factory.ixExtractor('multiselect_extractor', 'property_multiselect', ['templateWithSelects']),
  ],
  ixsuggestions: [],
  ixmodels: [
    {
      _id: testingDB.id(),
      status: 'ready',
      creationDate: 1,
      extractorId: factory.id('select_extractor'),
    },
    {
      _id: testingDB.id(),
      status: 'ready',
      creationDate: 1,
      extractorId: factory.id('multiselect_extractor'),
    },
  ],
  entities: [
    {
      _id: testingDB.id(),
      sharedId: 'entityWithSelects',
      title: 'entityWithSelects',
      language: 'en',
      metadata: {
        property_select: [{ value: '1B', label: '1B' }],
        property_multiselect: [
          { value: 'A', label: 'A' },
          { value: '1A', label: '1A' },
        ],
      },
      template: factory.id('templateWithSelects'),
    },
    {
      _id: testingDB.id(),
      sharedId: 'entityWithSelects',
      title: 'entityWithSelectsEs',
      language: 'es',
      metadata: {
        property_select: [{ value: '1B', label: '1Bes' }],
        property_multiselect: [
          { value: 'A', label: 'Aes' },
          { value: '1A', label: '1Aes' },
        ],
      },
      template: factory.id('templateWithSelects'),
    },
  ],
  files: [
    factory.fileDeprecated(
      'fileForentityWithSelects',
      'entityWithSelects',
      'document',
      'documentWithSelects.pdf',
      'eng',
      'documentWithSelects.pdf'
    ),
  ],
  dictionaries: [factory.nestedThesauri('Nested Thesaurus', ['A', 'B', { 1: ['1A', '1B'] }])],
  templates: [
    factory.template('templateWithSelects', [
      factory.property('property_select', 'select', {
        content: factory.id('Nested Thesaurus').toString(),
      }),
      factory.property('property_multiselect', 'multiselect', {
        content: factory.id('Nested Thesaurus').toString(),
      }),
    ]),
  ],
  translationsV2: [
    factory.v2.database.translationDBO(
      'Nested Thesaurus',
      'Nested Thesaurus',
      'en',
      dictionaryTranslationContext
    ),
    factory.v2.database.translationDBO(
      'Nested Thesaurus',
      'Nested Thesaurus Es',
      'es',
      dictionaryTranslationContext
    ),
    factory.v2.database.translationDBO('A', 'A', 'en', dictionaryTranslationContext),
    factory.v2.database.translationDBO('A', 'Aes', 'es', dictionaryTranslationContext),
    factory.v2.database.translationDBO('B', 'B', 'en', dictionaryTranslationContext),
    factory.v2.database.translationDBO('B', 'Bes', 'es', dictionaryTranslationContext),
    factory.v2.database.translationDBO('1', '1', 'en', dictionaryTranslationContext),
    factory.v2.database.translationDBO('1', '1es', 'es', dictionaryTranslationContext),
    factory.v2.database.translationDBO('1A', '1A', 'en', dictionaryTranslationContext),
    factory.v2.database.translationDBO('1A', '1Aes', 'es', dictionaryTranslationContext),
    factory.v2.database.translationDBO('1B', '1B', 'en', dictionaryTranslationContext),
    factory.v2.database.translationDBO('1B', '1Bes', 'es', dictionaryTranslationContext),
  ],
};

const relationshipAcceptanceFixtureBase: DBFixture = {
  settings: _.cloneDeep(ixSettings),
  ixextractors: [
    factory.ixExtractor('relationship_extractor', 'relationship_to_source', ['rel_template']),
    factory.ixExtractor(
      'relationship_with_inheritance_extractor',
      'relationship_with_inheritance',
      ['rel_template']
    ),
    factory.ixExtractor('relationship_to_any_extractor', 'relationship_to_any', ['rel_template']),
  ],
  ixsuggestions: [],
  ixmodels: [
    {
      _id: testingDB.id(),
      status: 'ready',
      creationDate: 1,
      extractorId: factory.id('relationship_extractor'),
    },
    {
      _id: testingDB.id(),
      status: 'ready',
      creationDate: 1,
      extractorId: factory.id('relationship_with_inheritance_extractor'),
    },
    {
      _id: testingDB.id(),
      status: 'ready',
      creationDate: 1,
      extractorId: factory.id('relationship_to_any_extractor'),
    },
  ],
  relationtypes: [
    factory.relationType('related'),
    factory.relationType('related_with_inheritance'),
    factory.relationType('related_to_any'),
  ],
  templates: [
    factory.template('source_template', [factory.property('text_to_inherit', 'text')]),
    factory.template('source_template_2', []),
    factory.template('rel_template', [
      factory.property('relationship_to_source', 'relationship', {
        content: factory.idString('source_template'),
        relationType: factory.idString('related'),
      }),
      factory.property('relationship_with_inheritance', 'relationship', {
        content: factory.idString('source_template'),
        relationType: factory.idString('related_with_inheritance'),
        inherit: {
          property: factory.idString('text_to_inherit'),
          type: 'text',
        },
      }),
      factory.property('relationship_to_any', 'relationship', {
        content: '',
        relationType: factory.idString('related_to_any'),
      }),
    ]),
  ],
  entities: [
    // ---------- sources
    {
      _id: testingDB.id(),
      sharedId: 'S1_sId',
      title: 'S1',
      language: 'en',
      metadata: { text_to_inherit: [{ value: 'inherited text' }] },
      template: factory.id('source_template'),
    },
    {
      _id: testingDB.id(),
      sharedId: 'S1_sId',
      title: 'S1_es',
      language: 'es',
      metadata: { text_to_inherit: [{ value: 'inherited text Spanish' }] },
      template: factory.id('source_template'),
    },
    {
      _id: testingDB.id(),
      sharedId: 'S2_sId',
      title: 'S2',
      language: 'en',
      metadata: { text_to_inherit: [{ value: 'inherited text 2' }] },
      template: factory.id('source_template'),
    },
    {
      _id: testingDB.id(),
      sharedId: 'S2_sId',
      title: 'S2_es',
      language: 'es',
      metadata: { text_to_inherit: [{ value: 'inherited text 2 Spanish' }] },
      template: factory.id('source_template'),
    },
    {
      _id: testingDB.id(),
      sharedId: 'S3_sId',
      title: 'S3',
      language: 'en',
      metadata: { text_to_inherit: [{ value: 'inherited text 3' }] },
      template: factory.id('source_template'),
    },
    {
      _id: testingDB.id(),
      sharedId: 'S3_sId',
      title: 'S3_es',
      language: 'es',
      metadata: { text_to_inherit: [{ value: 'inherited text 3 Spanish' }] },
      template: factory.id('source_template'),
    },
    // ---------- other sources
    {
      _id: testingDB.id(),
      sharedId: 'other_source',
      title: 'Other Source',
      language: 'en',
      metadata: {},
      template: factory.id('source_template_2'),
    },
    {
      _id: testingDB.id(),
      sharedId: 'other_source',
      title: 'Other Source Spanish',
      language: 'es',
      metadata: {},
      template: factory.id('source_template_2'),
    },
    {
      _id: testingDB.id(),
      sharedId: 'other_source_2',
      title: 'Other Source 2',
      language: 'en',
      metadata: {},
      template: factory.id('source_template_2'),
    },
    {
      _id: testingDB.id(),
      sharedId: 'other_source_2',
      title: 'Other Source 2 Spanish',
      language: 'es',
      metadata: {},
      template: factory.id('source_template_2'),
    },
    // ---------- with relationship
    {
      _id: testingDB.id(),
      sharedId: 'entityWithRelationships_sId',
      title: 'entityWithRelationships',
      language: 'en',
      metadata: {
        relationship_to_source: [
          { value: 'S1_sId', label: 'S1' },
          { value: 'S2_sId', label: 'S2' },
        ],
        relationship_with_inheritance: [
          {
            value: 'S1_sId',
            label: 'S1',
            inheritedType: 'text',
            inheritedValue: [
              {
                value: 'inherited text',
              },
            ],
          },
          {
            value: 'S2_sId',
            label: 'S2',
            inheritedType: 'text',
            inheritedValue: [
              {
                value: 'inherited text 2',
              },
            ],
          },
        ],
        relationship_to_any: [
          {
            value: 'S1_sId',
            label: 'S1',
          },
          {
            value: 'other_source',
            label: 'Other Source',
          },
        ],
      },
      template: factory.id('rel_template'),
    },
    {
      _id: testingDB.id(),
      sharedId: 'entityWithRelationships_sId',
      title: 'entityWithRelationshipsEs',
      language: 'es',
      metadata: {
        relationship_to_source: [
          { value: 'S1_sId', label: 'S1_es' },
          { value: 'S2_sId', label: 'S2_es' },
        ],
        relationship_with_inheritance: [
          {
            value: 'S1_sId',
            label: 'S1_es',
            inheritedType: 'text',
            inheritedValue: [
              {
                value: 'inherited text Spanish',
              },
            ],
          },
          {
            value: 'S2_sId',
            label: 'S2_es',
            inheritedType: 'text',
            inheritedValue: [
              {
                value: 'inherited text 2 Spanish',
              },
            ],
          },
        ],
        relationship_to_any: [
          {
            value: 'S1_sId',
            label: 'S1_es',
          },
          {
            value: 'other_source',
            label: 'Other Source Spanish',
          },
        ],
      },
      template: factory.id('rel_template'),
    },
  ],
  connections: [
    {
      _id: testingDB.id(),
      entity: 'entityWithRelationships_sId',
      hub: factory.id('hub_S1'),
    },
    {
      _id: testingDB.id(),
      entity: 'S1_sId',
      hub: factory.id('hub_S1'),
      template: factory.id('related'),
    },
    {
      _id: testingDB.id(),
      entity: 'entityWithRelationships_sId',
      hub: factory.id('hub_S2'),
    },
    {
      _id: testingDB.id(),
      entity: 'S2_sId',
      hub: factory.id('hub_S2'),
      template: factory.id('related'),
    },
    {
      _id: testingDB.id(),
      entity: 'entityWithRelationships_sId',
      hub: factory.id('hub_S1_inherited'),
    },
    {
      _id: testingDB.id(),
      entity: 'S1_sId',
      hub: factory.id('hub_S1_inherited'),
      template: factory.id('related_with_inheritance'),
    },
    {
      _id: testingDB.id(),
      entity: 'entityWithRelationships_sId',
      hub: factory.id('hub_S2_inherited'),
    },
    {
      _id: testingDB.id(),
      entity: 'S2_sId',
      hub: factory.id('hub_S2_inherited'),
      template: factory.id('related_with_inheritance'),
    },
    {
      _id: testingDB.id(),
      entity: 'entityWithRelationships_sId',
      hub: factory.id('hub_S1_any'),
    },
    {
      _id: testingDB.id(),
      entity: 'S1_sId',
      hub: factory.id('hub_S1_any'),
      template: factory.id('related_to_any'),
    },
    {
      _id: testingDB.id(),
      entity: 'entityWithRelationships_sId',
      hub: factory.id('hub_other_source_any'),
    },
    {
      _id: testingDB.id(),
      entity: 'other_source',
      hub: factory.id('hub_other_source_any'),
      template: factory.id('related_to_any'),
    },
  ],
  files: [
    factory.fileDeprecated(
      'fileForEntityWithRelationships',
      'entityWithRelationships_sId',
      'document',
      'documentWithRelationships.pdf',
      'eng',
      'documentWithRelationships.pdf'
    ),
  ],
};

export {
  factory,
  file2Id,
  file3Id,
  fixtures,
  stateFilterFixtures,
  shared2esId,
  shared2enId,
  shared6enId,
  suggestionSharedId6Title,
  suggestionSharedId6Enemy,
  personTemplateId,
  heroTemplateId,
  suggestionId,
  shared2AgeSuggestionId,
  selectAcceptanceFixtureBase,
  relationshipAcceptanceFixtureBase,
};
