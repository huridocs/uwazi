// @ts-expect-error TS(2307): Cannot find module '../eventsbus.js' or its corres... Remove this comment to see the full error message
import { EventsBus } from '../eventsbus.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/getConne... Remove this comment to see the full error message
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant.js';

import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../entities/events/EntityDelet... Remove this comment to see the full error message
import { EntityDeletedEvent } from '../entities/events/EntityDeletedEvent.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/utils/featureFlag... Remove this comment to see the full error message
import { featureFlaggedHandler } from '../common.v2/utils/featureFlaggedHandler.js';
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
