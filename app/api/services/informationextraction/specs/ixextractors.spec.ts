import _ from 'lodash';

import { Suggestions } from 'api/suggestions/suggestions';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import db, { DBFixture, testingDB } from 'api/utils/testing_db';
import { SuggestionState } from 'shared/types/suggestionSchema';
import { Extractors } from '../ixextractors';

const fixtureFactory = getFixturesFactory();

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
  templates: [
    fixtureFactory.template('personTemplate', [
      fixtureFactory.property('age', 'numeric'),
      fixtureFactory.property('enemy', 'text'),
    ]),
    fixtureFactory.template('animalTemplate', [fixtureFactory.property('kind', 'text')]),
    fixtureFactory.template('plantTemplate', [fixtureFactory.property('kind', 'text')]),
    fixtureFactory.template('fungusTemplate', [fixtureFactory.property('kind', 'text')]),
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
  ],
  files: [
    fixtureFactory.file('F1', 'shared2', 'document', 'documentB.pdf', 'eng', '', [
      {
        name: 'age',
        selection: {
          text: '30-40',
          selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
        },
      },
    ]),
    fixtureFactory.file('F2', 'shared2', 'document', 'documentC.pdf', 'spa', '', [
      {
        name: 'age',
        selection: {
          text: '~24',
          selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
        },
      },
    ]),
    fixtureFactory.file('F3', 'shared1', 'document', 'documentA.pdf', 'eng'),
    fixtureFactory.file('F4', 'shared1', 'document', 'documentD.pdf', 'spa'),
    fixtureFactory.file('F5', 'shared3', 'document', 'documentE.pdf', 'eng'),
    fixtureFactory.file('F6', 'shared3', 'document', 'documentF.pdf', 'spa'),
    fixtureFactory.file('F7', 'shared4', 'document', 'documentG.pdf', 'eng'),
    fixtureFactory.file('F8', 'shared4', 'document', 'documentH.pdf', 'spa'),
  ],
  ixextractors: [
    fixtureFactory.ixExtractor('existingExtractor', 'kind', ['animalTemplate', 'plantTemplate']),
    fixtureFactory.ixExtractor('fungusKindExtractor', 'kind', ['fungusTemplate']),
  ],
  ixsuggestions: [
    fixtureFactory.ixSuggestion(
      'sh1_en',
      'existingExtractor',
      'shared1',
      'animalTemplate',
      'F3',
      'kind'
    ),
    fixtureFactory.ixSuggestion(
      'sh1_es',
      'existingExtractor',
      'shared1',
      'animalTemplate',
      'F4',
      'kind',
      { language: 'es' }
    ),
    fixtureFactory.ixSuggestion(
      'sh3_en',
      'existingExtractor',
      'shared3',
      'plantTemplate',
      'F5',
      'kind'
    ),
    fixtureFactory.ixSuggestion(
      'sh4_en',
      'fungusKindExtractor',
      'shared4',
      'fungusTemplate',
      'F7',
      'kind'
    ),
    fixtureFactory.ixSuggestion(
      'sh4_es',
      'fungusKindExtractor',
      'shared4',
      'fungusTemplate',
      'F8',
      'kind',
      { language: 'es' }
    ),
  ],
};

describe('ixextractors', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('create()', () => {
    it('should create a new ixextractor', async () => {
      await Extractors.create('age_test', 'age', [fixtureFactory.id('personTemplate').toString()]);
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
            state: SuggestionState.labelEmpty,
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
            state: SuggestionState.labelEmpty,
            entityTemplate: fixtureFactory.id('personTemplate').toString(),
          },
        ],
      },
      {
        case: 'title',
        name: 'title_test',
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
            state: SuggestionState.valueEmpty,
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
            state: SuggestionState.valueEmpty,
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
            state: SuggestionState.valueEmpty,
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
            state: SuggestionState.valueEmpty,
            entityTemplate: fixtureFactory.id('personTemplate').toString(),
          },
        ],
      },
    ])(
      'it should create empty suggestions for $case',
      async ({ name, property, templates, expectedSuggestions }) => {
        await Extractors.create(name, property, templates);
        const [extractor] = await Extractors.get({ name });
        const suggestions = _.orderBy(await Suggestions.getByExtractor(extractor._id), [
          'entityId',
          'language',
        ]);
        expect(suggestions).toMatchObject(expectedSuggestions);
      }
    );
  });

  describe('update()', () => {
    it('should delete the existing suggestions when removing a template and add an empty suggestion when adding a template', async () => {
      await Extractors.update(
        fixtureFactory.id('existingExtractor').toString(),
        'existingExtractor',
        'kind',
        [fixtureFactory.id('animalTemplate').toString()]
      );

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

      await Extractors.update(
        fixtureFactory.id('existingExtractor').toString(),
        'existingExtractor',
        'kind',
        [
          fixtureFactory.id('animalTemplate').toString(),
          fixtureFactory.id('plantTemplate').toString(),
        ]
      );

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
      await Extractors.update(
        existing._id.toString(),
        'existingExtractor',
        'title',
        existing.templates.map(t => t.toString())
      );
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
