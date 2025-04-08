import { EventsBus } from 'api/eventsbus';
import { FileUpdatedEvent } from 'api/files/events/FileUpdatedEvent';
import { LanguageUtils } from 'shared/language';
import { featureFlaggedHandler } from 'api/common.v2/utils/featureFlaggedHandler';
import { PXEntityStatusManagerFactory } from './PXEntityStatusManagerFactory';
import { PXValidationError } from '../domain/PXValidationError';

export class PXFileUpdatedListener {
  private eventBus: EventsBus;

  constructor(eventBus: EventsBus) {
    this.eventBus = eventBus;
  }

  private static async afterFileUpdated(data: FileUpdatedEvent['data']) {
    const useCase = PXEntityStatusManagerFactory.createDefault();
    try {
      await useCase.execute({
        after: {
          entity: data.after.entity!,
          status: data.after.status!,
          type: data.after.type!,
          language: LanguageUtils.fromISO639_3(data.after.language!).ISO639_1!,
        },
        before: {
          entity: data.before.entity!,
          status: data.before.status!,
          type: data.before.type!,
          language: LanguageUtils.fromISO639_3(data.before.language!).ISO639_1!,
        },
      });
    } catch (e) {
      if (e instanceof PXValidationError) {
        return;
      }

      throw e;
    }
  }

  start() {
    this.eventBus.on(
      FileUpdatedEvent,
      featureFlaggedHandler(
        'paragraphExtraction',
        PXFileUpdatedListener.afterFileUpdated.bind(this)
      )
    );
  }
}
