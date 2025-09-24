// @ts-expect-error TS(2307): Cannot find module '../eventsbus.js' or its corres... Remove this comment to see the full error message
import { EventsBus } from '../eventsbus.js';

import { getFixturesFactory } from 'api/utils/fixturesFactory.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/utils/Test.js' or... Remove this comment to see the full error message
import { TestUtils } from '../common.v2/utils/Test.js';
// @ts-expect-error TS(2307): Cannot find module '../settings.v2/contracts/Setti... Remove this comment to see the full error message
import { SettingsDataSource } from '../settings.v2/contracts/SettingsDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../log.v2/infrastructure/MockL... Remove this comment to see the full error message
import { createMockLogger } from '../log.v2/infrastructure/MockLogger.js';
// @ts-expect-error TS(2307): Cannot find module '../entities/events/EntityUpdat... Remove this comment to see the full error message
import { EntityUpdatedEvent } from '../entities/events/EntityUpdatedEvent.js';
import { UpdateSuggestionsAfterEntityUpdate } from '../useCases/updateSuggestionsAfterEntityUpdate';
import { AfterEntityUpdatedListener } from '../listeners/afterEntityUpdatedListener';
import { ProcessSuggestionsAfterTemplateChanged } from '../useCases/processSuggestionsAfterTemplateChanged';

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
