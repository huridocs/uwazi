import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { EntityRelationshipsUpdateService } from '#api/entities.v2/services/EntityRelationshipsUpdateService.js';
import { DeprecatedEntitiesDataSource } from '#api/entities.v2/contracts/DeprecatedEntitiesDataSource.js';
import { RelationshipPropertyUpdateStrategy as Strategy } from './RelationshipPropertyUpdateStrategy.js';

interface IndexEntitiesCallback {
  (sharedIds: string[]): Promise<void>;
}

export class OnlineRelationshipPropertyUpdateStrategy implements Strategy {
  static BATCH_SIZE = 200;

  private indexEntities: IndexEntitiesCallback;

  private updater: EntityRelationshipsUpdateService;

  private transactionManager: TransactionManager;

  private entitiesDataSource: DeprecatedEntitiesDataSource;

  constructor(
    indexEntities: IndexEntitiesCallback,
    updater: EntityRelationshipsUpdateService,
    transactionManager: TransactionManager,
    entitiesDataSource: DeprecatedEntitiesDataSource
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
