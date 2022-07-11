import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DBFixture } from 'api/utils/testing_db';
import { SuggestionState } from 'shared/types/suggestionSchema';
import { createDefaultSuggestions } from '../configurationManager';
import { IXSuggestionsModel } from '../IXSuggestionsModel';

const factory = getFixturesFactory();

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
    factory.template('personTemplate', [
      factory.property('age', 'numeric'),
      factory.property('enemy', 'text'),
    ]),
    factory.template('animalTemplate', [factory.property('kind', 'text')]),
  ],
  entities: [
    factory.entity('shared1', 'animalTemplate', {}, { language: 'es' }),
    factory.entity('shared1', 'animalTemplate', {}, { language: 'en' }),
    factory.entity('shared2', 'personTemplate', {}, { language: 'es' }),
    factory.entity('shared2', 'personTemplate', {}, { language: 'en' }),
  ],
  files: [
    factory.file('F1', 'shared2', 'document', 'documentB.pdf', 'eng', '', [
      {
        name: 'age',
        selection: {
          text: 'scientific knowle3dge',
          selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
        },
      },
    ]),
    factory.file('F2', 'shared2', 'document', 'documentC.pdf', 'spa', '', [
      {
        name: 'age',
        selection: {
          text: 'conocimiento científico',
          selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
        },
      },
    ]),
    factory.file('F3', 'shared1', 'document', 'documentA.pdf', 'eng'),
    factory.file('F4', 'shared1', 'document', 'documentD.pdf', 'spa'),
  ],
};

describe('createBlankStates()', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create blank states based on settings', async () => {
    await IXSuggestionsModel.delete({});
    const settings = [
      {
        template: factory.id('personTemplate'),
        properties: ['title', 'age'],
      },
      {
        template: factory.id('animalTemplate'),
        properties: ['kind'],
      },
    ];

    await createDefaultSuggestions(settings, 'en', 2);
    const newSuggestions = await IXSuggestionsModel.get({});

    expect(newSuggestions.length).toBe(6);
    expect(newSuggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          state: SuggestionState.empty,
          propertyName: 'kind',
          entityId: 'shared1',
        }),
        expect.objectContaining({
          state: SuggestionState.empty,
          propertyName: 'kind',
          entityId: 'shared1',
        }),
        expect.objectContaining({
          state: SuggestionState.valueEmpty,
          propertyName: 'title',
          entityId: 'shared2',
        }),
        expect.objectContaining({
          state: SuggestionState.valueEmpty,
          propertyName: 'title',
          entityId: 'shared2',
        }),
        expect.objectContaining({
          state: SuggestionState.labelEmpty,
          propertyName: 'age',
          entityId: 'shared2',
        }),
        expect.objectContaining({
          state: SuggestionState.labelEmpty,
          propertyName: 'age',
          entityId: 'shared2',
        }),
      ])
    );
  });
});
