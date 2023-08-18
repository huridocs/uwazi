import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { EntityRelationshipsUpdateService } from 'api/entities.v2/services/EntityRelationshipsUpdateService';
import { Dispatchable, HeartbeatCallback } from 'api/queue.v2/application/contracts/Dispatchable';

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
