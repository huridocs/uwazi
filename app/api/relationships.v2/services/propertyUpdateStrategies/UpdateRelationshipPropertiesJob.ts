// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/Transac... Remove this comment to see the full error message
import { TransactionManager } from '../common.v2/contracts/TransactionManager.js';
// @ts-expect-error TS(2307): Cannot find module '../entities.v2/services/Entity... Remove this comment to see the full error message
import { EntityRelationshipsUpdateService } from '../entities.v2/services/EntityRelationshipsUpdateService.js';
// @ts-expect-error TS(2307): Cannot find module '../queue.v2/application/contra... Remove this comment to see the full error message
import { Dispatchable, HeartbeatCallback } from '../queue.v2/application/contracts/Dispatchable.js';

interface IndexEntitiesCallback {
  (sharedIds: string[]): Promise<void>;
}
export class UpdateRelationshipPropertiesJob implements Dispatchable {
  private updater: EntityRelationshipsUpdateService;

  private transactionManager: TransactionManager;

  private indexEntity: IndexEntitiesCallback;

  constructor(
    updater: EntityRelationshipsUpdateService,
    transactionManager: TransactionManager,
    indexEntity: IndexEntitiesCallback
  ) {
    this.updater = updater;
    this.transactionManager = transactionManager;
    this.indexEntity = indexEntity;
  }

  async handleDispatch(_heartbeat: HeartbeatCallback, params: { entityIds: string[] }) {
    await this.transactionManager.run(async () => {
      await this.updater.update(params.entityIds);

      this.transactionManager.onCommitted(async () => {
        await this.indexEntity(params.entityIds);
      });
    });
  }
}
