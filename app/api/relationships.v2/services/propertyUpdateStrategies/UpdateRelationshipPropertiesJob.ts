import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { EntityRelationshipsUpdateService } from 'api/entities.v2/services/EntityRelationshipsUpdateService';
import { Job } from 'api/queue.v2/contracts/Job';

interface IndexEntitiesCallback {
  (sharedId: string): Promise<void>;
}
export class UpdateRelationshipPropertiesJob extends Job {
  private entityId: string;

  updater?: EntityRelationshipsUpdateService;

  transactionManager?: TransactionManager;

  indexEntity?: IndexEntitiesCallback;

  constructor(entityId: string) {
    super();
    this.entityId = entityId;
  }

  async handle() {
    if (!this.updater) {
      throw new Error('Missing dependency: updater');
    }

    if (!this.transactionManager) {
      throw new Error('Missing dependency: transactionManager');
    }

    if (!this.indexEntity) {
      throw new Error('Missing dependency: indexEntity');
    }

    const { updater, transactionManager, indexEntity } = this;

    await transactionManager.run(async () => {
      await updater.update([this.entityId]);

      transactionManager.onCommitted(async () => {
        await indexEntity(this.entityId);
      });
    });
  }
}
