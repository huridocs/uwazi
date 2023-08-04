import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { EntityRelationshipsUpdateService } from 'api/entities.v2/services/EntityRelationshipsUpdateService';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { RelationshipPropertyUpdateStrategy as Strategy } from './RelationshipPropertyUpdateStrategy';

interface IndexEntitiesCallback {
  (sharedIds: string[]): Promise<void>;
}

export class OnlineRelationshipPropertyUpdateStrategy implements Strategy {
  static BATCH_SIZE = 200;

  private indexEntities: IndexEntitiesCallback;

  private updater: EntityRelationshipsUpdateService;

  private transactionManager: TransactionManager;

  private entitiesDataSource: EntitiesDataSource;

  constructor(
    indexEntities: IndexEntitiesCallback,
    updater: EntityRelationshipsUpdateService,
    transactionManager: TransactionManager,
    entitiesDataSource: EntitiesDataSource
  ) {
    this.indexEntities = indexEntities;
    this.updater = updater;
    this.transactionManager = transactionManager;
    this.entitiesDataSource = entitiesDataSource;
  }

  async update(candidateIds: string[]) {
    await this.transactionManager.run(async () => {
      await this.updater.update(candidateIds);

      this.transactionManager.onCommitted(async () => {
        await this.indexEntities(candidateIds);
      });
    });
  }

  async updateByTemplate(template: string): Promise<void> {
    await this.transactionManager.run(async () => {
      await this.entitiesDataSource
        .getIdsByTemplate(template)
        .forEachBatch(OnlineRelationshipPropertyUpdateStrategy.BATCH_SIZE, async sharedIds => {
          await this.updater.update(sharedIds);

          this.transactionManager.onCommitted(async () => {
            await this.indexEntities(sharedIds);
          });
        });
    });
  }
}
