import { EventsBus } from '#api/core/libs/eventsbus/index.js';

import { getFixturesFactory } from '#api/utils/fixturesFactory.js';

import { TestUtils } from '#api/common.v2/utils/Test.js';

import { createMockLogger } from '#api/core/libs/logger/infrastructure/MockLogger.js';

import { EntityUpdatedEvent } from '#api/entities/events/EntityUpdatedEvent.js';
import { UpdateSuggestionsAfterEntityUpdate } from '#api/suggestions/useCases/updateSuggestionsAfterEntityUpdate.js';
import { AfterEntityUpdatedListener } from '#api/suggestions/listeners/afterEntityUpdatedListener.js';
import { ProcessSuggestionsAfterTemplateChanged } from '#api/suggestions/useCases/processSuggestionsAfterTemplateChanged.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';

const factory = getFixturesFactory();

type Props = {
  settingsDS?: SettingsDataSource;
  updateSuggestionsAfterEntityUpdate?: UpdateSuggestionsAfterEntityUpdate;
};

const createSut = (props?: Props) => {
  const eventBus = new EventsBus();
  const updateSuggestionsAfterEntityUpdate =
    props?.updateSuggestionsAfterEntityUpdate ??
    TestUtils.mockClass<UpdateSuggestionsAfterEntityUpdate>({ execute: jest.fn() });

  const processSuggestionsAfterTemplateChanged =
    props?.updateSuggestionsAfterEntityUpdate ??
    TestUtils.mockClass<ProcessSuggestionsAfterTemplateChanged>({ execute: jest.fn() });

  const settingsDS =
    props?.settingsDS ??
    TestUtils.mockClass<SettingsDataSource>({
      get: jest.fn().mockResolvedValue({ features: { metadataExtraction: { url: 'any_url' } } }),
    });

  new AfterEntityUpdatedListener(eventBus, () => ({
    eventBus,
    settingsDS,
    updateSuggestionsAfterEntityUpdate,
    processSuggestionsAfterTemplateChanged,
    logger: createMockLogger(),
  })).start();

  return {
    updateSuggestionsAfterEntityUpdate,
    processSuggestionsAfterTemplateChanged,
    eventBus,
  };
};

describe('AfterEntityUpdatedListener', () => {
  it('should not call UpdateSuggestionsAfterEntityUpdate if title and metadata does not changed', async () => {
    const { updateSuggestionsAfterEntityUpdate, eventBus } = createSut();

    const entities = factory.entityInMultipleLanguages(['en', 'es'], 'any_entity');

    await eventBus.emit(
      new EntityUpdatedEvent({ before: entities, after: entities, targetLanguageKey: 'en' })
    );

    expect(updateSuggestionsAfterEntityUpdate.execute).not.toHaveBeenCalled();
  });

  it('should not call UpdateSuggestionsAfterEntityUpdate if template changed', async () => {
    const { updateSuggestionsAfterEntityUpdate, eventBus } = createSut();

    const entities = factory.entityInMultipleLanguages(['en', 'es'], 'any_entity', 'template_a');
    const entitiesChanged = factory.entityInMultipleLanguages(
      ['en', 'es'],
      'any_entity',
      'template_b',
      {
        text: [{ value: 'text' }],
      }
    );

    await eventBus.emit(
      new EntityUpdatedEvent({ before: entities, after: entitiesChanged, targetLanguageKey: 'en' })
    );

    expect(updateSuggestionsAfterEntityUpdate.execute).not.toHaveBeenCalled();
  });

  it('should not call Use case when feature flag is disabled', async () => {
    const settingsDS = TestUtils.mockClass<SettingsDataSource>({
      get: jest.fn().mockResolvedValue({ features: {} }),
    });

    const { updateSuggestionsAfterEntityUpdate, eventBus } = createSut({ settingsDS });

    const entities = factory.entityInMultipleLanguages(['en', 'es'], 'any_entity');

    await eventBus.emit(
      new EntityUpdatedEvent({ before: entities, after: entities, targetLanguageKey: 'en' })
    );

    expect(updateSuggestionsAfterEntityUpdate.execute).not.toHaveBeenCalled();
  });

  it('should call ProcessSuggestionsAfterTemplateChanged if template changed', async () => {
    const { processSuggestionsAfterTemplateChanged, eventBus } = createSut();

    const entities = factory.entityInMultipleLanguages(['en', 'es'], 'any_entity', 'template_a');
    const entitiesChanged = factory.entityInMultipleLanguages(
      ['en', 'es'],
      'any_entity',
      'template_b',
      {
        text: [{ value: 'text' }],
      }
    );

    await eventBus.emit(
      new EntityUpdatedEvent({ before: entities, after: entitiesChanged, targetLanguageKey: 'en' })
    );

    expect(processSuggestionsAfterTemplateChanged.execute).toHaveBeenCalled();
  });
});
