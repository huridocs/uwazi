import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { EntityUpdatedEvent } from '#api/entities/events/EntityUpdatedEvent.js';
import isEqual from 'lodash/isEqual.js';
import { ObjectId } from 'mongodb';
import { EntitySchema } from '#shared/types/entityType.js';
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

  private async onEvent(data: EntityUpdatedEvent['data']) {
    const settings = await this.deps.settingsDS.get();
    if (!settings.features?.metadataExtraction) return;

    const { after, before } = data;

    if (after[0]?.template?.toString() !== before[0]?.template?.toString()) {
      await this.deps.processSuggestionsAfterTemplateChanged.execute({
        entities: after,
        newTemplateId: after[0]!.template as ObjectId,
        oldTemplateId: before[0]!.template as ObjectId,
      });
      return;
    }

    const titleOrMetadataChanged = EntityUpdatedEvent.changedLanguagesOf(data).some(language =>
      AfterEntityUpdatedListener.titleOrMetadataChanged(language, before, after)
    );

    if (titleOrMetadataChanged) {
      await this.deps.updateSuggestionsAfterEntityUpdate.execute({
        entities: after,
        previousEntities: before,
      });
    }
  }

  private static titleOrMetadataChanged(
    language: string,
    before: EntitySchema[],
    after: EntitySchema[]
  ) {
    const afterEntity = after.find(e => e.language === language);
    const beforeEntity = before.find(e => e.language === language);

    return (
      afterEntity?.title !== beforeEntity?.title ||
      !isEqual(afterEntity?.metadata, beforeEntity?.metadata)
    );
  }
}
