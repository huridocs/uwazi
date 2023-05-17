import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { EntityRelationshipsUpdateService } from 'api/entities.v2/services/EntityRelationshipsUpdateService';
import { DenormalizationStrategy } from './DenormalizationStrategy';

interface IndexEntitiesCallback {
  (sharedIds: string[]): Promise<void>;
}

async function delay(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export class OnlineDenormalizationStrategy implements DenormalizationStrategy {
  private indexEntities: IndexEntitiesCallback;

  private updater: EntityRelationshipsUpdateService;

  private transactionManager: TransactionManager;

  static DELAY = 0;

  constructor(
    indexEntities: IndexEntitiesCallback,
    updater: EntityRelationshipsUpdateService,
    transactionManager: TransactionManager
  ) {
    this.indexEntities = indexEntities;
    this.updater = updater;
    this.transactionManager = transactionManager;
  }

  async execute(candidateIds: string[]) {
    await delay(OnlineDenormalizationStrategy.DELAY);

    await this.transactionManager.run(async () => {
      await candidateIds.reduce(async (previous, id) => {
        console.log(`[${OnlineDenormalizationStrategy.name}] Denormalizing ${id}`);

        await previous;
        return this.updater.update(id);
      }, Promise.resolve());

      this.transactionManager.onCommitted(async () => {
        await this.indexEntities(candidateIds);
      });
    });
  }
}
