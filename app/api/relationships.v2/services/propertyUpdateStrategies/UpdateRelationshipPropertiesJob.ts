import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { EntityRelationshipsUpdateService } from 'api/entities.v2/services/EntityRelationshipsUpdateService';
import { Job } from 'api/queue/contracts/Job';

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
    await this.transactionManager!.run(async () => {
      await this.updater!.update([this.entityId]);

      this.transactionManager?.onCommitted(async () => {
        await this.indexEntity!(this.entityId);
      });
    });
  }
}
