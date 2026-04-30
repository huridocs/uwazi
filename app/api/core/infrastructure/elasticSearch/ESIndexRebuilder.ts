/* eslint-disable max-statements */
import { Client } from '@elastic/elasticsearch';
import { ElasticSearchBootstrapper } from './provision/ElasticSearchBootstrapper.js';
import { MongoSlotsBootstrapper } from './entities/MongoSlotsBootstrapper.js';
import { SlotsReconciler } from './entities/SlotsReconciler.js';
import { EntityIndexerService } from './entities/EntityIndexerService.js';
import { FullTextIndexerService } from './entities/FullTextIndexerService.js';
import { IndexDefinition } from './Types.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { config } from '#api/config.js';

type ProgressEvent =
  | { stage: 'reset-indexes' }
  | { stage: 'reset-slots' }
  | { stage: 'reconcile-slots' }
  | { stage: 'indexing'; entitiesIndexed: number; fullTextIndexed: number }
  | { stage: 'done' };

type Deps = {
  esClient: Client;
  esBootstrapper: ElasticSearchBootstrapper;
  entityIndexer: EntityIndexerService;
  fullTextIndexer: FullTextIndexerService;
  slotsBootstrapper: MongoSlotsBootstrapper;
  slotsReconciler: SlotsReconciler;
  registry: Record<string, IndexDefinition>;
  logger: Logger;
  onProgress?: (e: ProgressEvent) => void;
};

class ESIndexRebuilder {
  constructor(private deps: Deps) {}

  private notify(event: ProgressEvent): void {
    if (!this.deps.onProgress) return;

    this.deps.onProgress(event);
  }

  async execute(): Promise<void> {
    if (config.ENVIRONMENT === 'production') {
      throw new Error('ESIndexRebuilder.execute() is not allowed in production');
    }

    this.notify({ stage: 'reset-indexes' });
    await this.deps.esBootstrapper.reset();

    this.notify({ stage: 'reset-slots' });
    await this.deps.slotsBootstrapper.reset();

    this.notify({ stage: 'reconcile-slots' });
    await this.deps.slotsReconciler.execute();

    let entitiesIndexed = 0;
    let fullTextIndexed = 0;
    const notifyIndexing = () =>
      this.notify({ stage: 'indexing', entitiesIndexed, fullTextIndexed });

    await Promise.all([
      this.deps.entityIndexer.syncAll({
        onBatch: ({ indexed }) => {
          entitiesIndexed = indexed;
          notifyIndexing();
        },
      }),
      this.deps.fullTextIndexer.syncAll({
        onBatch: ({ indexed }) => {
          fullTextIndexed = indexed;
          notifyIndexing();
        },
      }),
    ]);

    this.notify({ stage: 'done' });
  }
}

export { ESIndexRebuilder };
export type { ProgressEvent, Deps as ESIndexRebuilderDeps };
