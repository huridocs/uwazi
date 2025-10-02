/* eslint-disable max-statements */
import _ from 'lodash';

import { Suggestions } from 'api/suggestions/suggestions';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import db, { DBFixture, testingDB } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { testingTenants } from 'api/utils/testingTenants';
import { IXSuggestionStateType } from 'shared/types/suggestionType';
import { Extractors } from '../ixextractors';
import { IXValidationError } from '../IXValidationError';

const fixtureFactory = getFixturesFactory();

jest.mock('api/core/libs/queue/configuration/factories', () => ({
  DefaultDispatcher: jest.fn().mockImplementation(() => {
    const {
      SyncDispatcherForTests,
      // eslint-disable-next-line global-require
    } = require('api/core/libs/queue/infrastructure/SyncDispatcherForTests');
    const {
      CreateBlankStateSuggestionsJob,
      // eslint-disable-next-line global-require
    } = require('api/suggestions/jobs/CreateBlankStateSuggestionsJob');
    return new SyncDispatcherForTests({
      CreateBlankStateSuggestionsJob: async () => new CreateBlankStateSuggestionsJob(),
    });
  }),
}));

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        {
          default: true,
          key: 'en',
          label: 'English',
        },
        {
          key: 'es',
          label: 'Spanish',
        },
      ],
      features: {
        metadataExtraction: {
          url: 'https://example.com',
        },
      },
    },
  ],
  relationtypes: [fixtureFactory.relationType('owns')],
  templates: [
    fixtureFactory.template('personTemplate', [
      fixtureFactory.property('age', 'numeric'),
      fixtureFactory.property('enemy', 'text'),
      fixtureFactory.property('location', 'geolocation'),
      fixtureFactory.property('occupation', 'select', { content: fixtureFactory.idString('Jobs') }),
      fixtureFactory.property('spoken_languages', 'multiselect', {
        content: fixtureFactory.idString('Languages'),
      }),
      fixtureFactory.property('pets', 'relationship', {
        content: fixtureFactory.idString('animalTemplate'),
        relationType: fixtureFactory.idString('owns'),
      }),
      fixtureFactory.property('biography', 'markdown'),
    ]),
    fixtureFactory.template('animalTemplate', [fixtureFactory.property('kind', 'text')]),
    fixtureFactory.template('plantTemplate', [fixtureFactory.property('kind', 'text')]),
    fixtureFactory.template('fungusTemplate', [
      fixtureFactory.property('kind', 'text'),
      fixtureFactory.property('location', 'geolocation'),
    ]),
    fixtureFactory.template('extractor_target_rich_text_source_text_t', [
      fixtureFactory.property('target_rich_text', 'markdown'),
      fixtureFactory.property('source_text', 'text'),
    ]),
    fixtureFactory.template('extractor_target_rich_text_source_pdf_t', [
      fixtureFactory.property('target_rich_text', 'markdown'),
    ]),
  ],
  entities: [
    fixtureFactory.entity('shared1', 'animalTemplate', {}, { language: 'es' }),
    fixtureFactory.entity('shared1', 'animalTemplate', {}, { language: 'en' }),
    fixtureFactory.entity('shared2', 'personTemplate', {}, { language: 'es' }),
    fixtureFactory.entity('shared2', 'personTemplate', {}, { language: 'en' }),
    fixtureFactory.entity('shared3', 'plantTemplate', {}, { language: 'es' }),
    fixtureFactory.entity('shared3', 'plantTemplate', {}, { language: 'en' }),
    fixtureFactory.entity('shared4', 'fungusTemplate', {}, { language: 'es' }),
    fixtureFactory.entity('shared4', 'fungusTemplate', {}, { language: 'en' }),
    fixtureFactory.entity(
      'extractor_target_rich_text_source_text_e_1',
      'extractor_target_rich_text_source_text_t'
    ),
    fixtureFactory.entity(
      'extractor_target_rich_text_source_text_e_1',
      'extractor_target_rich_text_source_text_t',
      {},
      { language: 'es' }
    ),
    fixtureFactory.entity(
      'extractor_target_rich_text_source_pdf_e_1',
      'extractor_target_rich_text_source_pdf_t'
    ),
  ],
  files: [
    fixtureFactory.fileDeprecated('F1', 'shared2', 'document', 'documentB.pdf', 'eng', '', [
      {
        name: 'age',
        selection: {
          text: '30-40',
          selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
        },
      },
    ]),
    fixtureFactory.fileDeprecated('F2', 'shared2', 'document', 'documentC.pdf', 'spa', '', [
      {
        name: 'age',
        selection: {
          text: '~24',
          selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
        },
      },
    ]),
    fixtureFactory.fileDeprecated('F3', 'shared1', 'document', 'documentA.pdf', 'eng'),
    fixtureFactory.fileDeprecated('F4', 'shared1', 'document', 'documentD.pdf', 'spa'),
    fixtureFactory.fileDeprecated('F5', 'shared3', 'document', 'documentE.pdf', 'eng'),
    fixtureFactory.fileDeprecated('F6', 'shared3', 'document', 'documentF.pdf', 'spa'),
    fixtureFactory.fileDeprecated('F7', 'shared4', 'document', 'documentG.pdf', 'eng'),
    fixtureFactory.fileDeprecated('F8', 'shared4', 'document', 'documentH.pdf', 'spa'),
    fixtureFactory.fileDeprecated(
      'F9',
      'extractor_target_rich_text_source_pdf_e_1',
      'document',
      'documentI.pdf',
      'eng'
    ),
  ],
  ixextractors: [
    fixtureFactory.ixExtractor('existingExtractor', 'kind', ['animalTemplate', 'plantTemplate']),
    fixtureFactory.ixExtractor('fungusKindExtractor', 'kind', ['fungusTemplate']),
  ],
  ixsuggestions: [
    fixtureFactory.ixSuggestion_deprecated(
      'sh1_en',
      'existingExtractor',
      'shared1',
      'animalTemplate',
      'F3',
      'kind'
    ),
    fixtureFactory.ixSuggestion_deprecated(
      'sh1_es',
      'existingExtractor',
      'shared1',
      'animalTemplate',
      'F4',
      'kind',
      { language: 'es' }
    ),
    fixtureFactory.ixSuggestion_deprecated(
      'sh3_en',
      'existingExtractor',
      'shared3',
      'plantTemplate',
      'F5',
      'kind'
    ),
    fixtureFactory.ixSuggestion_deprecated(
      'sh4_en',
      'fungusKindExtractor',
      'shared4',
      'fungusTemplate',
      'F7',
      'kind'
    ),
    fixtureFactory.ixSuggestion_deprecated(
      'sh4_es',
      'fungusKindExtractor',
      'shared4',
      'fungusTemplate',
      'F8',
      'kind',
      { language: 'es' }
    ),
  ],
  dictionaries: [
    fixtureFactory.thesauri('Jobs', ['Developer', 'Tester']),
    fixtureFactory.thesauri('Languages', ['English', 'Spanish']),
  ],
};

const emptyState: IXSuggestionStateType = {
  labeled: false,
  withValue: false,
  withSuggestion: false,
  match: false,
  hasContext: false,
  obsolete: false,
  processing: false,
  error: false,
};

const expectedStates: Record<string, IXSuggestionStateType> = {
  onlyLabeled: {
    ...emptyState,
    labeled: true,
  },
  onlyValue: {
    ...emptyState,
    withValue: true,
  },
  onlyContext: {
    ...emptyState,
    hasContext: true,
  },
};

describe('ixextractors', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
    testingTenants.changeCurrentTenant({
      name: 'ixTenant',
    });
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('create()', () => {
    it('should create a new ixextractor', async () => {
      await testingEnvironment.setFixtures({
        ...fixtures,
        files: [
          ...fixtures.files!,
          fixtureFactory.fileDeprecated('F10', 'shared2', 'document', 'documentI.pdf', 'por'),
        ],
      });
      await Extractors.create({
        name: 'age_test',
        property: 'age',
        source: { pdf: true },
        templates: [fixtureFactory.id('personTemplate').toString()],
      });
      const [ixextractor] = await Extractors.get({ name: 'age_test' });
      expect(ixextractor).toMatchObject({
        name: 'age_test',
        property: 'age',
        templates: [fixtureFactory.id('personTemplate')],
      });
    });

    it.each([
      {
        case: 'a property',
        name: 'age_test',
        source: { pdf: true },
        property: 'age',
        templates: [fixtureFactory.id('personTemplate').toString()],
        expectedSuggestions: [
          {
            status: 'ready',
            entityId: 'shared2',
            language: 'en',
            fileId: fixtureFactory.id('F1'),
            propertyName: 'age',
            error: '',
            segment: '',
            suggestedValue: '',
            state: { ...expectedStates.onlyLabeled, labeled: false },
            entityTemplate: fixtureFactory.id('personTemplate').toString(),
          },
          {
            status: 'ready',
            entityId: 'shared2',
            language: 'es',
            fileId: fixtureFactory.id('F2'),
            propertyName: 'age',
            error: '',
            segment: '',
            suggestedValue: '',
            state: { ...expectedStates.onlyLabeled, labeled: false },
            entityTemplate: fixtureFactory.id('personTemplate').toString(),
          },
        ],
      },
      {
        case: 'title',
        name: 'title_test',
        source: { pdf: true },
        property: 'title',
        templates: [
          fixtureFactory.id('personTemplate').toString(),
          fixtureFactory.id('animalTemplate').toString(),
        ],
        expectedSuggestions: [
          {
            status: 'ready',
            entityId: 'shared1',
            language: 'en',
            fileId: fixtureFactory.id('F3'),
            propertyName: 'title',
            error: '',
            segment: '',
            suggestedValue: '',
            state: { ...expectedStates.onlyValue, labeled: true },
            entityTemplate: fixtureFactory.id('animalTemplate').toString(),
          },
          {
            status: 'ready',
            entityId: 'shared1',
            language: 'es',
            fileId: fixtureFactory.id('F4'),
            propertyName: 'title',
            error: '',
            segment: '',
            suggestedValue: '',
            state: { ...expectedStates.onlyValue, labeled: true },
            entityTemplate: fixtureFactory.id('animalTemplate').toString(),
          },
          {
            status: 'ready',
            entityId: 'shared2',
            language: 'en',
            fileId: fixtureFactory.id('F1'),
            propertyName: 'title',
            error: '',
            segment: '',
            suggestedValue: '',
            state: { ...expectedStates.onlyValue, labeled: true },
            entityTemplate: fixtureFactory.id('personTemplate').toString(),
          },
          {
            status: 'ready',
            entityId: 'shared2',
            language: 'es',
            fileId: fixtureFactory.id('F2'),
            propertyName: 'title',
            error: '',
            segment: '',
            suggestedValue: '',
            state: { ...expectedStates.onlyValue, labeled: true },
            entityTemplate: fixtureFactory.id('personTemplate').toString(),
          },
        ],
      },
      {
        case: 'selects',
        name: 'occupation_test',
        source: { pdf: true },
        property: 'occupation',
        templates: [fixtureFactory.id('personTemplate').toString()],
        expectedSuggestions: [
          {
            status: 'ready',
            entityId: 'shared2',
            language: 'en',
            fileId: fixtureFactory.id('F1'),
            propertyName: 'occupation',
            error: '',
            segment: '',
            suggestedValue: '',
            state: expectedStates.onlyContext,
            entityTemplate: fixtureFactory.id('personTemplate').toString(),
          },
          {
            status: 'ready',
            entityId: 'shared2',
            language: 'es',
            fileId: fixtureFactory.id('F2'),
            propertyName: 'occupation',
            error: '',
            segment: '',
            suggestedValue: '',
            state: expectedStates.onlyContext,
            entityTemplate: fixtureFactory.id('personTemplate').toString(),
          },
        ],
      },
      {
        case: 'multiselects',
        name: 'spoken_languages_test',
        source: { pdf: true },
        property: 'spoken_languages',
        templates: [fixtureFactory.id('personTemplate').toString()],
        expectedSuggestions: [
          {
            status: 'ready',
            entityId: 'shared2',
            language: 'en',
            fileId: fixtureFactory.id('F1'),
            propertyName: 'spoken_languages',
            error: '',
            segment: '',
            suggestedValue: [],
            state: expectedStates.onlyContext,
            entityTemplate: fixtureFactory.id('personTemplate').toString(),
          },
          {
            status: 'ready',
            entityId: 'shared2',
            language: 'es',
            fileId: fixtureFactory.id('F2'),
            propertyName: 'spoken_languages',
            error: '',
            segment: '',
            suggestedValue: [],
            state: expectedStates.onlyContext,
            entityTemplate: fixtureFactory.id('personTemplate').toString(),
          },
        ],
      },
      {
        case: 'relationships',
        name: 'pets_test',
        source: { pdf: true },
        property: 'pets',
        templates: [fixtureFactory.id('personTemplate').toString()],
        expectedSuggestions: [
          {
            status: 'ready',
            entityId: 'shared2',
            language: 'en',
            fileId: fixtureFactory.id('F1'),
            propertyName: 'pets',
            error: '',
            segment: '',
            suggestedValue: [],
            state: expectedStates.onlyContext,
            entityTemplate: fixtureFactory.id('personTemplate').toString(),
          },
          {
            status: 'ready',
            entityId: 'shared2',
            language: 'es',
            fileId: fixtureFactory.id('F2'),
            propertyName: 'pets',
            error: '',
            segment: '',
            suggestedValue: [],
            state: expectedStates.onlyContext,
            entityTemplate: fixtureFactory.id('personTemplate').toString(),
          },
        ],
      },
      {
        case: 'a property as source',
        name: 'from_property',
        source: { property: 'biography' },
        property: 'age',
        templates: [fixtureFactory.id('personTemplate').toString()],
        expectedSuggestions: [
          {
            status: 'ready',
            entityId: 'shared2',
            language: 'en',
            propertyName: 'age',
            error: '',
            segment: '',
            suggestedValue: '',
            state: emptyState,
            entityTemplate: fixtureFactory.id('personTemplate').toString(),
          },
          {
            status: 'ready',
            entityId: 'shared2',
            language: 'es',
            propertyName: 'age',
            error: '',
            segment: '',
            suggestedValue: '',
            state: emptyState,
            entityTemplate: fixtureFactory.id('personTemplate').toString(),
          },
        ],
      },
      {
        case: 'rich text as target and text as source',
        name: 'rich_text_target_source_text',
        source: { property: 'source_text' },
        property: 'target_rich_text',
        templates: [fixtureFactory.id('extractor_target_rich_text_source_text_t').toString()],
        expectedSuggestions: [
          {
            status: 'ready',
            entityId: 'extractor_target_rich_text_source_text_e_1',
            language: 'en',
            propertyName: 'target_rich_text',
            error: '',
            segment: '',
            suggestedValue: '',
            state: emptyState,
            entityTemplate: fixtureFactory
              .id('extractor_target_rich_text_source_text_t')
              .toString(),
          },
          {
            status: 'ready',
            entityId: 'extractor_target_rich_text_source_text_e_1',
            language: 'es',
            propertyName: 'target_rich_text',
            error: '',
            segment: '',
            suggestedValue: '',
            state: emptyState,
            entityTemplate: fixtureFactory
              .id('extractor_target_rich_text_source_text_t')
              .toString(),
          },
        ],
      },
      {
        case: 'rich text as target and PDF as source',
        name: 'rich_text_target_source_pdf',
        source: { pdf: true },
        property: 'target_rich_text',
        templates: [fixtureFactory.id('extractor_target_rich_text_source_pdf_t').toString()],
        expectedSuggestions: [
          {
            status: 'ready',
            entityId: 'extractor_target_rich_text_source_pdf_e_1',
            language: 'en',
            fileId: fixtureFactory.id('F9'),
            propertyName: 'target_rich_text',
            error: '',
            segment: '',
            suggestedValue: '',
            state: { ...expectedStates.onlyContext, hasContext: false },
            entityTemplate: fixtureFactory.id('extractor_target_rich_text_source_pdf_t').toString(),
          },
        ],
      },
    ])(
      'should create empty suggestions for $case',
      async ({ name, property, source, templates, expectedSuggestions }) => {
        await Extractors.create({ name, property, source, templates });
        const [extractor] = await Extractors.get({ name });
        const suggestions = _.orderBy(await Suggestions.getByExtractor(extractor._id), [
          'entityId',
          'language',
        ]);
        expect(suggestions.length).toBe(expectedSuggestions.length);
        expect(suggestions).toMatchObject(expectedSuggestions);
      }
    );

    it('should create Blank Suggestions for Extractor of PDF', async () => {
      const template = fixtureFactory.template('extractor_source_pdf_target_text_template', [
        fixtureFactory.property('target_text', 'text'),
      ]);

      const entityA = fixtureFactory.entityInMultipleLanguages(
        ['en', 'es'],
        'entityA',
        template.name
      );

      const entityB = fixtureFactory.entityInMultipleLanguages(
        ['en', 'es'],
        'entityB',
        template.name
      );

      const entityC = fixtureFactory.entityInMultipleLanguages(
        ['en', 'es'],
        'entityC',
        template.name
      );

      const entityD = fixtureFactory.entityInMultipleLanguages(
        ['en', 'es'],
        'entityD',
        template.name
      );

      const entityE = fixtureFactory.entityInMultipleLanguages(
        ['en', 'es'],
        'entityE',
        template.name
      );

      const file1A = fixtureFactory.document('file1_A', { entity: 'entityA', language: 'en' });
      const file2A = fixtureFactory.document('file2_A', { entity: 'entityA', language: 'es' });
      const file3A = fixtureFactory.document('file3_A', { entity: 'entityA', language: 'pt' });

      const file1B = fixtureFactory.document('file1_B', { entity: 'entityB', language: 'en' });
      const file2B = fixtureFactory.document('file2_B', { entity: 'entityB', language: 'es' });

      const file1D = fixtureFactory.document('file3_D', { entity: 'entityD', language: 'pt' });

      const file1E = fixtureFactory.document('file3_E', { entity: 'entityE', language: 'en' });

      await testingEnvironment.setFixtures({
        ...fixtures,
        templates: [template],
        files: [file1A, file2A, file3A, file1B, file2B, file1D, file1E],
        entities: [...entityA, ...entityB, ...entityC, ...entityD, ...entityE],
      });

      const extractor = await Extractors.create({
        name: 'extractor_source_pdf_target_text',
        property: 'target_text',
        source: { pdf: true },
        templates: [fixtureFactory.id('extractor_source_pdf_target_text_template').toString()],
      });

      const suggestions = await Suggestions.getByExtractor(extractor._id);
      const sorted = _.orderBy(suggestions, ['entityId', 'language']);

      expect(suggestions.length).toBe(5);
      expect(sorted).toMatchObject([
        {
          fileId: file1A._id,
          language: 'en',
          entityId: 'entityA',
        },
        {
          fileId: file2A._id,
          language: 'es',
          entityId: 'entityA',
        },
        {
          fileId: file1B._id,
          language: 'en',
          entityId: 'entityB',
        },
        {
          fileId: file2B._id,
          language: 'es',
          entityId: 'entityB',
        },
        {
          fileId: file1E._id,
          language: 'en',
          entityId: 'entityE',
        },
      ]);
    });

    it('should throw if the property does not exist', async () => {
      await expect(async () =>
        Extractors.create({
          name: 'invalid extractor',
          source: { pdf: true },
          property: 'invalid_property',
          templates: [fixtureFactory.id('personTemplate').toString()],
        })
      ).rejects.toMatchObject({
        code: IXValidationError.codes.PROPERTY_MISSING,
      });
      const [extractor] = await Extractors.get({ name: 'invalid extractor' });
      expect(extractor).toBe(undefined);
    });

    it('should throw if the property is not of an allowed type', async () => {
      await expect(async () =>
        Extractors.create({
          name: 'invalid extractor',
          source: { pdf: true },
          property: 'location',
          templates: [fixtureFactory.id('personTemplate').toString()],
        })
      ).rejects.toMatchObject({
        code: IXValidationError.codes.PROPERTY_TYPE_NOT_ALLOWED,
      });
      const [extractor] = await Extractors.get({ name: 'invalid extractor' });
      expect(extractor).toBe(undefined);
    });
  });

  describe('update()', () => {
    it('should delete the existing suggestions when removing a template and add an empty suggestion when adding a template', async () => {
      await Extractors.update({
        _id: fixtureFactory.id('existingExtractor'),
        name: 'existingExtractor',
        source: { pdf: true },
        property: 'kind',
        templates: [fixtureFactory.id('animalTemplate').toString()],
      });

      const [extractor] = await Extractors.get({ name: 'existingExtractor' });
      expect(extractor.templates).toEqual([fixtureFactory.id('animalTemplate')]);

      let suggestions = await testingDB.mongodb
        ?.collection('ixsuggestions')
        .find(
          { extractorId: fixtureFactory.id('existingExtractor') },
          { sort: { entityId: 1, language: 1 } }
        )
        .toArray();

      expect(suggestions).toEqual([
        expect.objectContaining({
          entityId: 'shared1',
          entityTemplate: fixtureFactory.id('animalTemplate').toString(),
          language: 'en',
        }),
        expect.objectContaining({
          entityId: 'shared1',
          entityTemplate: fixtureFactory.id('animalTemplate').toString(),
          language: 'es',
        }),
      ]);

      await Extractors.update({
        _id: fixtureFactory.id('existingExtractor'),
        name: 'existingExtractor',
        source: { pdf: true },
        property: 'kind',
        templates: [
          fixtureFactory.id('animalTemplate').toString(),
          fixtureFactory.id('plantTemplate').toString(),
        ],
      });

      suggestions = await testingDB.mongodb
        ?.collection('ixsuggestions')
        .find(
          { extractorId: fixtureFactory.id('existingExtractor') },
          { sort: { entityId: 1, language: 1 } }
        )
        .toArray();
      expect(suggestions).toEqual([
        expect.objectContaining({
          entityId: 'shared1',
          entityTemplate: fixtureFactory.id('animalTemplate').toString(),
          language: 'en',
        }),
        expect.objectContaining({
          entityId: 'shared1',
          entityTemplate: fixtureFactory.id('animalTemplate').toString(),
          language: 'es',
        }),
        expect.objectContaining({
          entityId: 'shared3',
          entityTemplate: fixtureFactory.id('plantTemplate').toString(),
          language: 'en',
        }),
        expect.objectContaining({
          entityId: 'shared3',
          entityTemplate: fixtureFactory.id('plantTemplate').toString(),
          language: 'es',
        }),
      ]);
    });

    it('should delete existing suggestions when the property is changed, and create new blank suggestions', async () => {
      const [existing] = await Extractors.get({ name: 'existingExtractor' });
      await Extractors.update({
        _id: existing._id,
        source: { pdf: true },
        name: 'existingExtractor',
        property: 'title',
        templates: existing.templates.map(t => t.toString()),
      });
      const suggestions = _.orderBy(await Suggestions.getByExtractor(existing._id), [
        'entityId',
        'language',
      ]);
      expect(suggestions).toMatchObject([
        {
          entityId: 'shared1',
          entityTemplate: fixtureFactory.id('animalTemplate').toString(),
          language: 'en',
          propertyName: 'title',
        },
        {
          entityId: 'shared1',
          entityTemplate: fixtureFactory.id('animalTemplate').toString(),
          language: 'es',
          propertyName: 'title',
        },
        {
          entityId: 'shared3',
          entityTemplate: fixtureFactory.id('plantTemplate').toString(),
          language: 'en',
          propertyName: 'title',
        },
        {
          entityId: 'shared3',
          entityTemplate: fixtureFactory.id('plantTemplate').toString(),
          language: 'es',
          propertyName: 'title',
        },
      ]);
    });

    it('should throw if the property does not exist', async () => {
      const [existing] = await Extractors.get({ name: 'fungusKindExtractor' });
      await expect(async () =>
        Extractors.update({
          _id: existing._id,
          name: 'existingExtractor',
          source: { pdf: true },
          property: 'missing_property',
          templates: existing.templates.map(t => t.toString()),
        })
      ).rejects.toMatchObject({
        code: IXValidationError.codes.PROPERTY_MISSING,
      });
      const [extractor] = await Extractors.get({ name: 'fungusKindExtractor' });
      expect(extractor).toEqual(existing);
    });

    it('should throw if the property is not of an allowed type', async () => {
      const [existing] = await Extractors.get({ name: 'fungusKindExtractor' });
      await expect(async () =>
        Extractors.update({
          _id: existing._id,
          name: 'existingExtractor',
          source: { pdf: true },
          property: 'location',
          templates: existing.templates.map(t => t.toString()),
        })
      ).rejects.toMatchObject({
        code: IXValidationError.codes.PROPERTY_TYPE_NOT_ALLOWED,
      });
      const [extractor] = await Extractors.get({ name: 'fungusKindExtractor' });
      expect(extractor).toEqual(existing);
    });
  });

  describe('delete()', () => {
    it('should delete the extractors and their suggestions', async () => {
      await Extractors.delete([
        fixtureFactory.id('existingExtractor').toString(),
        fixtureFactory.id('fungusKindExtractor').toString(),
      ]);
      const extractors = await Extractors.get();
      expect(extractors).toEqual([]);
      const suggestions = await testingDB.mongodb?.collection('ixsuggestions').find().toArray();
      expect(suggestions).toEqual([]);
    });
  });
});
