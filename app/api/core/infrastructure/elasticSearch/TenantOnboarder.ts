/* eslint-disable no-await-in-loop */
/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';
import { ProcessedPDFDBO } from '../mongodb/files/schemas/filesTypes.js';
import { MongoSlotsBootstrapper } from './entities/MongoSlotsBootstrapper.js';
import { SlotsReconciler } from './entities/SlotsReconciler.js';
import { EntityIndexerService } from './entities/EntityIndexerService.js';
import { FullTextIndexerService } from './entities/FullTextIndexerService.js';
import { MongoEntityDAO } from '../mongodb/entity/MongoEntityDAO.js';
import { MongoFilesDAO } from '../mongodb/files/MongoFilesDAO.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';

type ProgressEvent =
  | { stage: 'bootstrap-slots' }
  | { stage: 'reconcile-slots' }
  | { stage: 'index-entities'; indexed: number; lastSharedId: string }
  | { stage: 'index-fulltext'; indexed: number; lastFileId: string }
  | { stage: 'catch-up'; indexed: number }
  | { stage: 'done' };

type ResumeFrom = {
  entitySharedId?: string;
  fileId?: ObjectId;
};

type Deps = {
  entityIndexer: EntityIndexerService;
  fullTextIndexer: FullTextIndexerService;
  slotsBootstrapper: MongoSlotsBootstrapper;
  slotsReconciler: SlotsReconciler;
  entityDAO: MongoEntityDAO;
  filesDAO: MongoFilesDAO;
  transactionManager: TransactionManager;
  logger: Logger;
  batchSize?: number;
  startedAt?: Date;
  onProgress?: (e: ProgressEvent) => void;
};

class TenantOnboarder {
  private static BATCH_SIZE = 500;

  constructor(private deps: Deps) {}

  private get batchSize() {
    return this.deps.batchSize || TenantOnboarder.BATCH_SIZE;
  }

  private notify(event: ProgressEvent): void {
    if (!this.deps.onProgress) return;
    this.deps.onProgress(event);
  }

  async execute(resumeFrom?: ResumeFrom): Promise<void> {
    this.notify({ stage: 'bootstrap-slots' });
    await this.deps.slotsBootstrapper.execute();

    this.notify({ stage: 'reconcile-slots' });
    await this.deps.transactionManager.run(async () => this.deps.slotsReconciler.execute());

    let entitiesIndexed = 0;
    const entityCursor = this.deps.entityDAO.streamAll({
      afterSharedId: resumeFrom?.entitySharedId,
    });
    let entityBatch: EntityDBO[] = [];
    let prevSharedId: string | undefined;

    try {
      while (await entityCursor.hasNext()) {
        const entity = (await entityCursor.next())!;

        if (entity.sharedId !== prevSharedId && entityBatch.length >= this.batchSize) {
          await this.deps.entityIndexer.index(entityBatch);
          entitiesIndexed += entityBatch.length;
          this.notify({
            stage: 'index-entities',
            indexed: entitiesIndexed,
            lastSharedId: prevSharedId!,
          });
          entityBatch = [];
        }

        entityBatch.push(entity);
        prevSharedId = entity.sharedId;
      }

      if (entityBatch.length > 0) {
        await this.deps.entityIndexer.index(entityBatch);
        entitiesIndexed += entityBatch.length;
        this.notify({
          stage: 'index-entities',
          indexed: entitiesIndexed,
          lastSharedId: prevSharedId!,
        });
      }
    } finally {
      await entityCursor.close();
    }

    let fulltextIndexed = 0;
    const fileCursor = this.deps.filesDAO.streamProcessedDocs({ afterId: resumeFrom?.fileId });
    let fileBatch: ProcessedPDFDBO[] = [];

    try {
      while (await fileCursor.hasNext()) {
        const file = (await fileCursor.next())!;
        fileBatch.push(file);

        if (fileBatch.length >= this.batchSize) {
          await this.deps.fullTextIndexer.index(fileBatch);
          fulltextIndexed += fileBatch.length;
          const lastFileId = (
            fileBatch[fileBatch.length - 1]._id as unknown as ObjectId
          ).toString();
          this.notify({ stage: 'index-fulltext', indexed: fulltextIndexed, lastFileId });
          fileBatch = [];
        }
      }

      if (fileBatch.length > 0) {
        await this.deps.fullTextIndexer.index(fileBatch);
        fulltextIndexed += fileBatch.length;
        const lastFileId = (fileBatch[fileBatch.length - 1]._id as unknown as ObjectId).toString();
        this.notify({ stage: 'index-fulltext', indexed: fulltextIndexed, lastFileId });
      }
    } finally {
      await fileCursor.close();
    }

    this.notify({ stage: 'done' });
  }
}

export { TenantOnboarder };
export type { ProgressEvent, ResumeFrom, Deps as TenantOnboarderDeps };
