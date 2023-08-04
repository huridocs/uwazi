import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { EntityRelationshipsUpdateService } from 'api/entities.v2/services/EntityRelationshipsUpdateService';
import { RelationshipPropertyUpdateStrategy as Strategy } from './RelationshipPropertyUpdateStrategy';

interface IndexEntitiesCallback {
  (sharedIds: string[]): Promise<void>;
}

export class OnlineRelationshipPropertyUpdateStrategy implements Strategy {
  private indexEntities: IndexEntitiesCallback;

  private updater: EntityRelationshipsUpdateService;

  private transactionManager: TransactionManager;

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
    await this.transactionManager.run(async () => {
      await this.updater.update(candidateIds);

      this.transactionManager.onCommitted(async () => {
        await this.indexEntities(candidateIds);
      });
    });
  }

  async updateByTemplate(_candidatesTemplate: string): Promise<void> {
    throw new Error('not implemented');
  }
}
