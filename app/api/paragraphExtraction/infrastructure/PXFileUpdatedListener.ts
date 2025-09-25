
import { featureFlaggedHandler } from '../common.v2/utils/featureFlaggedHandler.js';

import { EventsBus } from '../eventsbus.js';

import { FileUpdatedEvent } from '../files/events/FileUpdatedEvent.js';

import { DefaultLogger } from 'api/log.v2/infrastructure/StandardLogger.js';

import { LanguageUtils } from 'shared/language/index.js';
import { inspect } from 'util';
import { PXValidationError } from '../domain/PXValidationError';
import { PXEntityStatusManagerFactory } from './PXEntityStatusManagerFactory';

export class PXFileUpdatedListener {
  private eventBus: EventsBus;

  constructor(eventBus: EventsBus) {
    this.eventBus = eventBus;
  }

  private static async afterFileUpdated(data: FileUpdatedEvent['data']) {
    const useCase = PXEntityStatusManagerFactory.createDefault();
    const logger = DefaultLogger();

    try {
      await useCase.execute({
        after: {
          id: data.after._id!.toString(),
          entity: data.after.entity!,
          status: data.after.status!,
          type: data.after.type!,
          language: LanguageUtils.fromISO639_3(data.after.language!).ISO639_1!,
        },
        before: {
          id: data.before._id!.toString(),
          entity: data.before.entity!,
          status: data.before.status!,
          type: data.before.type!,
          language: LanguageUtils.fromISO639_3(data.before.language!).ISO639_1!,
        },
      });
    } catch (e) {
      if (e instanceof PXValidationError) {
        logger.info(inspect(e));
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
