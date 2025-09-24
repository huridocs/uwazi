// @ts-expect-error TS(2307): Cannot find module '../eventsbus.js' or its corres... Remove this comment to see the full error message
import { EventsBus } from '../eventsbus.js';
// @ts-expect-error TS(2307): Cannot find module '../settings.v2/contracts/Setti... Remove this comment to see the full error message
import { SettingsDataSource } from '../settings.v2/contracts/SettingsDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../log.v2/contracts/Logger.js'... Remove this comment to see the full error message
import { Logger } from '../log.v2/contracts/Logger.js';
// @ts-expect-error TS(2307): Cannot find module '../entities/events/EntityUpdat... Remove this comment to see the full error message
import { EntityUpdatedEvent } from '../entities/events/EntityUpdatedEvent.js';
import { isEqual } from 'lodash';
import { ObjectId } from 'mongodb';
import { UpdateSuggestionsAfterEntityUpdate } from '../useCases/updateSuggestionsAfterEntityUpdate';
import { ProcessSuggestionsAfterTemplateChanged } from '../useCases/processSuggestionsAfterTemplateChanged';

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

    // @ts-expect-error TS(7006): Parameter 'e' implicitly has an 'any' type.
    const afterEntity = after.find(e => e.language === targetLanguageKey);
    // @ts-expect-error TS(7006): Parameter 'e' implicitly has an 'any' type.
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
