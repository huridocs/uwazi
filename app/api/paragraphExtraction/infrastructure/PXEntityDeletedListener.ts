import { EventsBus } from 'api/core/libs/eventsbus';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { EntityDeletedEvent } from 'api/entities/events/EntityDeletedEvent';
import { featureFlaggedHandler } from 'api/common.v2/utils/featureFlaggedHandler';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';

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
      const mongoTransactionManager = DefaultTransactionManager();
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
