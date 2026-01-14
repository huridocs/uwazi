import { EntityDeletedEvent } from '../entities/events/EntityDeletedEvent.js';

import { EventsBus } from '../eventsbus.js';
import { FilesDeletedEvent } from '../files/events/FilesDeletedEvent.js';
import { Extractors } from '../services/informationextraction/ixextractors.js';
import settings from '../settings/index.js';
import templates from '../templates/index.js';
import { TemplateDeletedEvent } from '../templates/events/TemplateDeletedEvent.js';
import { TemplateUpdatedEvent } from '../templates/events/TemplateUpdatedEvent.js';
import { IXSuggestionType } from '#shared/types/suggestionType.js';
import { EntityCreatedEvent } from '../entities/events/EntityCreatedEvent.js';
import { DefaultSettingsDataSource } from '#api/settings.v2/database/data_source_defaults.js';
import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';
import { DefaultLogger } from '#api/log.v2/infrastructure/StandardLogger.js';
import { Suggestions } from './suggestions';
import { AfterFileUpdatedListener } from './listeners/afterFileCreatedListener';
import { CreateBlankSuggestionsFromDocument } from './useCases/createBlankSuggestionsFromDocument';
import { SuggestionFactory } from './suggestionFactory';
import { AfterEntityUpdatedListener } from './listeners/afterEntityUpdatedListener';
import { UpdateSuggestionsAfterEntityUpdate } from './useCases/updateSuggestionsAfterEntityUpdate';
import { ProcessSuggestionsAfterTemplateChanged } from './useCases/processSuggestionsAfterTemplateChanged';

const featureIsEnabled = async () => {
  const configuration = await settings.get();
  return !!configuration.features?.metadataExtraction;
};

const registerEventListeners = (eventsBus: EventsBus) => {
  new AfterEntityUpdatedListener(eventsBus, () => ({
    eventBus: eventsBus,
    settingsDS: SettingsDataSourceFactory.default(TransactionManagerFactory.default()),
    logger: LoggerFactory.default(),
    updateSuggestionsAfterEntityUpdate: new UpdateSuggestionsAfterEntityUpdate(),
    processSuggestionsAfterTemplateChanged: new ProcessSuggestionsAfterTemplateChanged(),
  })).start();

  eventsBus.on(EntityCreatedEvent, async ({ entities }) => {
    if (!(await featureIsEnabled())) return;

    const extractors = await Extractors.get({
      templates: { $in: [entities[0].template] },
      'source.property': { $exists: true },
    });

    if (!extractors.length) return;

    const targetProperty = await templates.getPropertyByName(extractors[0].property);

    const suggestionsToSave: IXSuggestionType[] = [];

    extractors.forEach(extractor =>
      entities.forEach(entity =>
        suggestionsToSave.push(
          SuggestionFactory.createForProperty({ entity, extractor, targetProperty })
        )
      )
    );

    if (!suggestionsToSave.length) return;

    await Suggestions.saveMultiple(suggestionsToSave);
  });

  eventsBus.on(EntityDeletedEvent, async ({ entity }) => {
    if (!(await featureIsEnabled())) return;
    await Suggestions.deleteByEntityId(entity[0].sharedId!);
  });

  new AfterFileUpdatedListener(eventsBus, () => ({
    eventBus: eventsBus,
    settingsDS: SettingsDataSourceFactory.default(TransactionManagerFactory.default()),
    createBlankSuggestionsFromDocument: new CreateBlankSuggestionsFromDocument(),
    logger: LoggerFactory.default(),
  })).start();

  eventsBus.on(FilesDeletedEvent, async ({ files: _files }) => {
    if (!(await featureIsEnabled())) return;
    await Suggestions.delete({ fileId: { $in: _files.map(f => f._id) } });
  });

  eventsBus.on(TemplateUpdatedEvent, async ({ after }) => {
    if (!(await featureIsEnabled())) return;
    const templatePropertyNames = after.properties?.map(p => p.name) || ['title'];
    await Extractors.cleanupTemplateFromPropertyExtractors(after._id!.toString(), [
      ...templatePropertyNames,
      'title',
    ]);
  });

  eventsBus.on(TemplateDeletedEvent, async ({ templateId }) => {
    if (!(await featureIsEnabled())) return;
    await Extractors.cleanupTemplateFromPropertyExtractors(templateId, []);
  });
};

export { registerEventListeners };
