import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { EntityRelationshipsUpdateService } from 'api/entities.v2/services/EntityRelationshipsUpdateService';
import { RelationshipPropertyUpdateStrategy as Strategy } from './RelationshipPropertyUpdateStrategy';

interface IndexEntitiesCallback {
  (sharedIds: string[]): Promise<void>;
}

async function delay(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export class OnlineRelationshipPropertyUpdateStrategy implements Strategy {
  private indexEntities: IndexEntitiesCallback;

  private updater: EntityRelationshipsUpdateService;

  private transactionManager: TransactionManager;

  static DELAY = 20000;

  constructor(
    indexEntities: IndexEntitiesCallback,
    updater: EntityRelationshipsUpdateService,
    transactionManager: TransactionManager
  ) {
    this.indexEntities = indexEntities;
    this.updater = updater;
    this.transactionManager = transactionManager;
  }

  async update(candidateIds: string[]) {
    await delay(OnlineRelationshipPropertyUpdateStrategy.DELAY);

    await this.transactionManager.run(async () => {
      await this.updater.update(candidateIds);

      this.transactionManager.onCommitted(async () => {
        await this.indexEntities(candidateIds);
      });
    });
  }
}
