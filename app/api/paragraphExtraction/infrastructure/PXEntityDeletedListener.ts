import { EventsBus } from 'api/core/libs/eventsbus';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
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
