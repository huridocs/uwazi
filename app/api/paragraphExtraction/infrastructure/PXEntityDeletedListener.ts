import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { EntityDeletedEvent } from '#api/entities/events/EntityDeletedEvent.js';
import { featureFlaggedHandler } from '#api/common.v2/utils/featureFlaggedHandler.js';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource.js';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory.js';

type Dependencies = {
  entitiesStatusDS: PXEntitiesStatusDataSource;
};

export class PXEntityDeletedListener {
  private eventBus: EventsBus;

  constructor(eventBus: EventsBus) {
    this.eventBus = eventBus;
  }

  /** Built per event, from the context of the tenant the event belongs to. */
  private static buildDependencies(): Dependencies {
    return {
      entitiesStatusDS: PXEntitiesStatusDataSourceFactory.createDefault({
        connection: getConnection(),
        mongoTransactionManager: ExecutionContext.mongoTransactionManager,
      }),
    };
  }

  private static async afterEntityDeleted({ entity }: EntityDeletedEvent['data']) {
    const { entitiesStatusDS } = PXEntityDeletedListener.buildDependencies();
    await entitiesStatusDS.deleteBySourceEntity(entity[0].sharedId!);
  }

  start() {
    this.eventBus.on(
      EntityDeletedEvent,
      featureFlaggedHandler('paragraphExtraction', PXEntityDeletedListener.afterEntityDeleted)
    );
  }
}
