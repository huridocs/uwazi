/* eslint-disable no-await-in-loop */
/* eslint-disable max-statements */
import { Client } from '@elastic/elasticsearch';
import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';
import { ProcessedPDFDBO } from '../mongodb/files/schemas/filesTypes.js';
import { ElasticSearchBootstrapper } from './provision/ElasticSearchBootstrapper.js';
import { MongoSlotsBootstrapper } from './entities/MongoSlotsBootstrapper.js';
import { SlotsReconciler } from './entities/SlotsReconciler.js';
import { EntityIndexerService } from './entities/EntityIndexerService.js';
import { FullTextIndexerService } from './entities/FullTextIndexerService.js';
import { MongoEntityDAO } from '../mongodb/entity/MongoEntityDAO.js';
import { MongoFilesDAO } from '../mongodb/files/MongoFilesDAO.js';
import { IndexDefinition } from './Types.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';

type ProgressEvent =
  | { stage: 'reset-indexes' }
  | { stage: 'reset-slots' }
  | { stage: 'reconcile-slots' }
  | { stage: 'index-entities'; indexed: number }
  | { stage: 'index-fulltext'; indexed: number }
  | { stage: 'done' };

type Deps = {
  esClient: Client;
  esBootstrapper: ElasticSearchBootstrapper;
  entityIndexer: EntityIndexerService;
  fullTextIndexer: FullTextIndexerService;
  slotsBootstrapper: MongoSlotsBootstrapper;
  slotsReconciler: SlotsReconciler;
  entityDAO: MongoEntityDAO;
  filesDAO: MongoFilesDAO;
  registry: Record<string, IndexDefinition>;
  logger: Logger;
  batchSize?: number;
  onProgress?: (e: ProgressEvent) => void;
};

class ESIndexRebuilder {
  private static BATCH_SIZE = 500;

  constructor(private deps: Deps) {}

  private get batchSize() {
    return this.deps.batchSize || ESIndexRebuilder.BATCH_SIZE;
  }

  private notify(event: ProgressEvent): void {
    if (!this.deps.onProgress) return;

    this.deps.onProgress(event);
  }

  async execute(): Promise<void> {
    this.notify({ stage: 'reset-indexes' });
    await this.deps.esBootstrapper.reset();

    this.notify({ stage: 'reset-slots' });
    await this.deps.slotsBootstrapper.reset();

    this.notify({ stage: 'reconcile-slots' });
    await this.deps.slotsReconciler.execute();

    let entitiesIndexed = 0;
    const entityCursor = this.deps.entityDAO.streamAll();
    let entityBatch: EntityDBO[] = [];
    let prevSharedId: string | undefined;

    while (await entityCursor.hasNext()) {
      const entity = (await entityCursor.next())!;

      if (entity.sharedId !== prevSharedId && entityBatch.length >= this.batchSize) {
        await this.deps.entityIndexer.index(entityBatch);
        entitiesIndexed += entityBatch.length;
        this.notify({ stage: 'index-entities', indexed: entitiesIndexed });
        entityBatch = [];
      }

      entityBatch.push(entity);
      prevSharedId = entity.sharedId;
    }

    if (entityBatch.length > 0) {
      await this.deps.entityIndexer.index(entityBatch);
      entitiesIndexed += entityBatch.length;
      this.notify({ stage: 'index-entities', indexed: entitiesIndexed });
    }

    await entityCursor.close();

    let fulltextIndexed = 0;
    const fileCursor = this.deps.filesDAO.streamProcessedDocs();
    let fileBatch: ProcessedPDFDBO[] = [];

    while (await fileCursor.hasNext()) {
      fileBatch.push((await fileCursor.next())!);

      if (fileBatch.length >= this.batchSize) {
        await this.deps.fullTextIndexer.index(fileBatch);
        fulltextIndexed += fileBatch.length;
        this.notify({ stage: 'index-fulltext', indexed: fulltextIndexed });
        fileBatch = [];
      }
    }

    if (fileBatch.length > 0) {
      await this.deps.fullTextIndexer.index(fileBatch);
      fulltextIndexed += fileBatch.length;
      this.notify({ stage: 'index-fulltext', indexed: fulltextIndexed });
    }

    await fileCursor.close();

    this.notify({ stage: 'done' });
  }
}

export { ESIndexRebuilder };
export type { ProgressEvent, Deps as ESIndexRebuilderDeps };
