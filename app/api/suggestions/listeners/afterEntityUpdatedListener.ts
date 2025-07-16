import { EventsBus } from 'api/eventsbus';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { Logger } from 'api/log.v2/contracts/Logger';
import { EntityUpdatedEvent } from 'api/entities/events/EntityUpdatedEvent';
import { isEqual } from 'lodash';
import { UpdateSuggestionsAfterEntityUpdate } from '../useCases/updateSuggestionsAfterEntityUpdate';

type Dependencies = {
  settingsDS: SettingsDataSource;
  logger: Logger;
  updateSuggestionsAfterEntityUpdate: UpdateSuggestionsAfterEntityUpdate;
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
    }
  }
}
