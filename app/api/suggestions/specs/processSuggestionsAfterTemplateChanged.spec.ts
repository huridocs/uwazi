import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DBFixture } from 'api/utils/testing_db';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import {
  Input,
  ProcessSuggestionsAfterTemplateChanged,
} from '../useCases/processSuggestionsAfterTemplateChanged';

const factory = getFixturesFactory();

const entity1 = factory.entityInMultipleLanguages(
  ['en', 'es'],
  'entity_1',
  'extractor_source_text_target_text_1_template_1',
  { text_target: [{ value: 'any_value' }] }
);

const entity2 = factory.entityInMultipleLanguages(
  ['en', 'es'],
  'entity_2',
  'extractor_source_text_target_text_1_template_1',
  { text_target: [{ value: 'any_value' }] }
);

const fixtures: DBFixture = {
  templates: [
    factory.template('extractor_source_text_target_text_1_template_1', [
      factory.property('target_text', 'text'),
      factory.property('source_text', 'text'),
    ]),

    factory.template('extractor_source_text_target_text_2_template_1', [
      factory.property('target_text', 'text'),
      factory.property('source_text', 'text'),
    ]),

    factory.template('template_with_none_extractor', [
      factory.property('target_text', 'text'),
      factory.property('source_text', 'text'),
    ]),
  ],
  ixextractors: [
    factory.ixExtractor(
      'extractor_source_text_target_text_1',
      'target_text',
      ['extractor_source_text_target_text_1_template_1'],
      {
        property: 'source_text',
      }
    ),

    factory.ixExtractor(
      'extractor_source_text_target_text_2',
      'target_text',
      ['extractor_source_text_target_text_2_template_1'],
      {
        property: 'source_text',
      }
    ),
  ],

  entities: [...entity1, ...entity2],

  ixsuggestions: [
    factory.ixSuggestion({
      entityId: 'entity_1',
      language: 'en',
      extractorId: factory.id('extractor_source_text_target_text_1'),
      propertyName: 'target_text',
      currentValue: 'any_value',
      entityTitle: 'entity_1',
      entityTemplate: factory.id('extractor_source_text_target_text_1_template_1').toString(),
      status: 'ready',
    }),
    factory.ixSuggestion({
      entityId: 'entity_1',
      language: 'es',
      extractorId: factory.id('extractor_source_text_target_text_1'),
      propertyName: 'target_text',
      currentValue: 'any_value',
      entityTitle: 'entity_1',
      entityTemplate: factory.id('extractor_source_text_target_text_1_template_1').toString(),
      status: 'ready',
    }),
    factory.ixSuggestion({
      entityId: 'entity_2',
      language: 'en',
      extractorId: factory.id('extractor_source_text_target_text_1'),
      propertyName: 'target_text',
      currentValue: 'any_value',
      entityTitle: 'entity_2',
      entityTemplate: factory.id('extractor_source_text_target_text_1_template_1').toString(),
      status: 'ready',
    }),
    factory.ixSuggestion({
      entityId: 'entity_2',
      language: 'es',
      extractorId: factory.id('extractor_source_text_target_text_1'),
      propertyName: 'target_text',
      currentValue: 'any_value',
      entityTitle: 'entity_2',
      entityTemplate: factory.id('extractor_source_text_target_text_1_template_1').toString(),
      status: 'ready',
    }),
  ],
};

const createSut = () => {
  const sut = new ProcessSuggestionsAfterTemplateChanged();

  return {
    sut,
  };
};

describe('ProcessSuggestionsAfterTemplateChanged', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should delete Suggestions for each Extractor linked to old Template', async () => {
    const input: Input = {
      newTemplateId: factory.id('extractor_source_text_target_text_2_template_1'),
      oldTemplateId: factory.id('extractor_source_text_target_text_1_template_1'),
      entities: entity1.map(e => ({
        ...e,
        template: factory.id('template_with_none_extractor'),
      })),
    };

    const { sut } = createSut();

    await sut.execute(input);

    const suggestions = await testingEnvironment.db.getAllFrom('ixsuggestions');

    const oldEntity1Suggestions = suggestions?.filter(
      s => s.entityTemplate === input.oldTemplateId.toString() && s.entityId === entity1[0].sharedId
    );

    expect(oldEntity1Suggestions).toHaveLength(0);

    expect(
      suggestions?.filter(
        s => s.entityTemplate === input.oldTemplateId.toString() && s.entityId === 'entity_2'
      )
    ).toHaveLength(2);
    expect(suggestions).toHaveLength(4);
  });

  it('should create Suggestions for each Extractor linked to new Template', async () => {
    const input: Input = {
      newTemplateId: factory.id('extractor_source_text_target_text_2_template_1'),
      oldTemplateId: factory.id('extractor_source_text_target_text_1_template_1'),
      entities: entity1.map(e => ({
        ...e,
        template: factory.id('extractor_source_text_target_text_2_template_1'),
      })),
    };

    const { sut } = createSut();

    await sut.execute(input);

    const suggestions = await testingEnvironment.db.getAllFrom('ixsuggestions');

    const newEntity1Suggestions = suggestions?.filter(
      s => s.entityTemplate === input.newTemplateId.toString() && s.entityId === entity1[0].sharedId
    );

    expect(suggestions).toHaveLength(4);
    expect(newEntity1Suggestions).toHaveLength(2);
  });

  it('should not create Suggestions if new Template is invalid', async () => {
    const input: Input = {
      newTemplateId: factory.id('template_with_none_extractor'),
      oldTemplateId: factory.id('extractor_source_text_target_text_1_template_1'),
      entities: entity1.map(e => ({
        ...e,
        template: factory.id('template_with_none_extractor'),
      })),
    };

    const { sut } = createSut();

    await sut.execute(input);

    const suggestions = await testingEnvironment.db.getAllFrom('ixsuggestions');

    const newEntity1Suggestions = suggestions?.filter(
      s => s.entityTemplate === input.newTemplateId.toString() && s.entityId === entity1[0].sharedId
    );

    expect(suggestions).toHaveLength(2);
    expect(newEntity1Suggestions).toHaveLength(0);
  });
});
