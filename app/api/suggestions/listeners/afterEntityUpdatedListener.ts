import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { EntityUpdatedEvent } from '#api/entities/events/EntityUpdatedEvent.js';
import isEqual from 'lodash/isEqual.js';
import { ObjectId } from 'mongodb';
import { UpdateSuggestionsAfterEntityUpdate } from '../useCases/updateSuggestionsAfterEntityUpdate.js';
import { ProcessSuggestionsAfterTemplateChanged } from '../useCases/processSuggestionsAfterTemplateChanged.js';

type Dependencies = {
  settingsDS: SettingsDataSource;
  logger: Logger;
  updateSuggestionsAfterEntityUpdate: UpdateSuggestionsAfterEntityUpdate;
  processSuggestionsAfterTemplateChanged: ProcessSuggestionsAfterTemplateChanged;
};

export class AfterEntityUpdatedListener {
  constructor(
    private eventBus: EventsBus,
    private depsFactory: () => Dependencies
  ) {}

  private get deps() {
    return this.depsFactory();
  }

  start() {
    this.eventBus.on(EntityUpdatedEvent, this.onEvent.bind(this));
  }

  private async onEvent({ after, before, targetLanguageKey }: EntityUpdatedEvent['data']) {
    const settings = await this.deps.settingsDS.get();
    if (!settings.features?.metadataExtraction) return;

    const afterEntity = after.find(e => e.language === targetLanguageKey);
    const beforeEntity = before.find(e => e.language === targetLanguageKey);

    if (afterEntity?.template?.toString() === beforeEntity?.template?.toString()) {
      if (
        afterEntity?.title === beforeEntity?.title &&
        isEqual(afterEntity?.metadata, beforeEntity?.metadata)
      ) {
        return;
      }

      await this.deps.updateSuggestionsAfterEntityUpdate.execute({ entities: after });
    } else {
      await this.deps.processSuggestionsAfterTemplateChanged.execute({
        entities: after,
        newTemplateId: after[0]!.template as ObjectId,
        oldTemplateId: before[0]!.template as ObjectId,
      });
    }
  }
}
