// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/Transac... Remove this comment to see the full error message
import { TransactionManager } from '../common.v2/contracts/TransactionManager.js';
// @ts-expect-error TS(2307): Cannot find module '../entities.v2/services/Entity... Remove this comment to see the full error message
import { EntityRelationshipsUpdateService } from '../entities.v2/services/EntityRelationshipsUpdateService.js';
// @ts-expect-error TS(2307): Cannot find module '../entities.v2/contracts/Entit... Remove this comment to see the full error message
import { EntitiesDataSource } from '../entities.v2/contracts/EntitiesDataSource.js';
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
        // @ts-expect-error TS(7006): Parameter 'sharedIds' implicitly has an 'any' type... Remove this comment to see the full error message
        .forEachBatch(OnlineRelationshipPropertyUpdateStrategy.BATCH_SIZE, async sharedIds => {
          await this.updater.update(sharedIds);

          this.transactionManager.onCommitted(async () => {
            await this.indexEntities(sharedIds);
          });
        });
    });
  }
}
