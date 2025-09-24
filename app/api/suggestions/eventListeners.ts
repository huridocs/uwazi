import { EntityDeletedEvent } from '../entities/events/EntityDeletedEvent.js';
// @ts-expect-error TS(2307): Cannot find module '../eventsbus.js' or its corres... Remove this comment to see the full error message
import { EventsBus } from '../eventsbus.js';
import { FilesDeletedEvent } from '../files/events/FilesDeletedEvent.js';
import { Extractors } from '../services/informationextraction/ixextractors.js';
import settings from '../settings/index.js';
import templates from '../templates/index.js';
import { TemplateDeletedEvent } from '../templates/events/TemplateDeletedEvent.js';
import { TemplateUpdatedEvent } from '../templates/events/TemplateUpdatedEvent.js';
import { IXSuggestionType } from 'shared/types/suggestionType.js';
import { EntityCreatedEvent } from '../entities/events/EntityCreatedEvent.js';
import { DefaultSettingsDataSource } from '../settings.v2/database/data_source_defaults.js';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults.js';
import { DefaultLogger } from '../log.v2/infrastructure/StandardLogger.js';
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
    settingsDS: DefaultSettingsDataSource(DefaultTransactionManager()),
    logger: DefaultLogger(),
    updateSuggestionsAfterEntityUpdate: new UpdateSuggestionsAfterEntityUpdate(),
    processSuggestionsAfterTemplateChanged: new ProcessSuggestionsAfterTemplateChanged(),
  })).start();

  // @ts-expect-error TS(7031): Binding element 'entities' implicitly has an 'any'... Remove this comment to see the full error message
  eventsBus.on(EntityCreatedEvent, async ({ entities }) => {
    if (!(await featureIsEnabled())) return;

    const extractors = await Extractors.get({
      templates: { $in: [entities[0].template] },
      'source.property': { $exists: true },
    });

    if (!extractors.length) return;

    const targetProperty = await templates.getPropertyByName(extractors[0].property);

    const suggestionsToSave: IXSuggestionType[] = [];

    // @ts-expect-error TS(7006): Parameter 'extractor' implicitly has an 'any' type... Remove this comment to see the full error message
    extractors.forEach(extractor =>
      // @ts-expect-error TS(7006): Parameter 'entity' implicitly has an 'any' type.
      entities.forEach(entity =>
        suggestionsToSave.push(
          SuggestionFactory.createForProperty({ entity, extractor, targetProperty })
        )
      )
    );

    if (!suggestionsToSave.length) return;

    await Suggestions.saveMultiple(suggestionsToSave);
  });

  // @ts-expect-error TS(7031): Binding element 'entity' implicitly has an 'any' t... Remove this comment to see the full error message
  eventsBus.on(EntityDeletedEvent, async ({ entity }) => {
    if (!(await featureIsEnabled())) return;
    await Suggestions.deleteByEntityId(entity[0].sharedId!);
  });

  new AfterFileUpdatedListener(eventsBus, () => ({
    eventBus: eventsBus,
    settingsDS: DefaultSettingsDataSource(DefaultTransactionManager()),
    createBlankSuggestionsFromDocument: new CreateBlankSuggestionsFromDocument(),
    logger: DefaultLogger(),
  })).start();

  // @ts-expect-error TS(7031): Binding element '_files' implicitly has an 'any' t... Remove this comment to see the full error message
  eventsBus.on(FilesDeletedEvent, async ({ files: _files }) => {
    if (!(await featureIsEnabled())) return;
    // @ts-expect-error TS(7006): Parameter 'f' implicitly has an 'any' type.
    await Suggestions.delete({ fileId: { $in: _files.map(f => f._id) } });
  });

  // @ts-expect-error TS(7031): Binding element 'after' implicitly has an 'any' ty... Remove this comment to see the full error message
  eventsBus.on(TemplateUpdatedEvent, async ({ after }) => {
    if (!(await featureIsEnabled())) return;
    // @ts-expect-error TS(7006): Parameter 'p' implicitly has an 'any' type.
    const templatePropertyNames = after.properties?.map(p => p.name) || ['title'];
    await Extractors.cleanupTemplateFromPropertyExtractors(after._id!.toString(), [
      ...templatePropertyNames,
      'title',
    ]);
  });

  // @ts-expect-error TS(7031): Binding element 'templateId' implicitly has an 'an... Remove this comment to see the full error message
  eventsBus.on(TemplateDeletedEvent, async ({ templateId }) => {
    if (!(await featureIsEnabled())) return;
    await Extractors.cleanupTemplateFromPropertyExtractors(templateId, []);
  });
};

export { registerEventListeners };
