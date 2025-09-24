// @ts-expect-error TS(2307): Cannot find module '../common.v2/utils/featureFlag... Remove this comment to see the full error message
import { featureFlaggedHandler } from '../common.v2/utils/featureFlaggedHandler.js';
// @ts-expect-error TS(2307): Cannot find module '../eventsbus.js' or its corres... Remove this comment to see the full error message
import { EventsBus } from '../eventsbus.js';
// @ts-expect-error TS(2307): Cannot find module '../files/events/FileUpdatedEve... Remove this comment to see the full error message
import { FileUpdatedEvent } from '../files/events/FileUpdatedEvent.js';
// @ts-expect-error TS(2307): Cannot find module '../log.v2/infrastructure/Stand... Remove this comment to see the full error message
import { DefaultLogger } from '../log.v2/infrastructure/StandardLogger.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/language/index.js... Remove this comment to see the full error message
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
