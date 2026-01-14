import { EventsBus } from '#api/eventsbus/index.js';

import { getConnection } from '#api/common.v2/database/getConnectionForCurrentTenant.js';

import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import { featureFlaggedHandler } from '#api/common.v2/utils/featureFlaggedHandler.js';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';
import { EntityDeletedEvent } from '#api/entities/events/EntityDeletedEvent.js';

type Dependencies = {
  entitiesStatusDS: PXEntitiesStatusDataSource;
};

export class PXEntityDeletedListener {
  private dependencies!: Dependencies;

  private eventBus: EventsBus;

  constructor(eventBus: EventsBus) {
    this.eventBus = eventBus;
  }

  private setupDependencies() {
    if (!this.dependencies) {
      const connection = getConnection();
      const mongoTransactionManager = TransactionManagerFactory.default();
      const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
        connection,
        mongoTransactionManager,
      });

      this.dependencies = { entitiesStatusDS };
    }
  }

  private async afterEntityDeleted({ entity }: EntityDeletedEvent['data']) {
    this.setupDependencies();
    await this.dependencies.entitiesStatusDS.deleteBySourceEntity(entity[0].sharedId!);
  }

  start() {
    this.eventBus.on(
      EntityDeletedEvent,
      featureFlaggedHandler('paragraphExtraction', this.afterEntityDeleted.bind(this))
    );
  }
}
