import { ObjectId } from 'mongodb';
import { MongoSlotsBootstrapper } from './entities/MongoSlotsBootstrapper.js';
import { SlotsReconciler } from './entities/SlotsReconciler.js';
import { EntityIndexerService } from './entities/EntityIndexerService.js';
import { FullTextIndexerService } from './entities/FullTextIndexerService.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';

type ProgressEvent =
  | { stage: 'bootstrap-slots' }
  | { stage: 'reconcile-slots' }
  | {
      stage: 'indexing';
      entitiesIndexed: number;
      lastSharedId: string;
      entitiesToIndex: number;
      fullTextIndexed: number;
      lastFileId: string;
      fullTextToIndex: number;
    }
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
  transactionManager: TransactionManager;
  logger: Logger;
  onProgress?: (e: ProgressEvent) => void;
};

class TenantOnboarder {
  constructor(private deps: Deps) {}

  private notify(event: ProgressEvent): void {
    if (!this.deps.onProgress) return;
    this.deps.onProgress(event);
  }

  private async indexInParallel(resumeFrom?: ResumeFrom): Promise<void> {
    let entitiesIndexed = 0;
    let lastSharedId = '';
    let entitiesToIndex = 0;
    let fullTextIndexed = 0;
    let lastFileId = '';
    let fullTextToIndex = 0;
    const notifyIndexing = () =>
      this.notify({
        stage: 'indexing',
        entitiesIndexed,
        lastSharedId,
        entitiesToIndex,
        fullTextIndexed,
        lastFileId,
        fullTextToIndex,
      });

    await Promise.all([
      this.deps.entityIndexer.syncAll({
        afterSharedId: resumeFrom?.entitySharedId,
        onBatch: ({ indexed, lastSharedId: sid, total }) => {
          entitiesIndexed = indexed;
          lastSharedId = sid;
          entitiesToIndex = total;
          notifyIndexing();
        },
      }),
      this.deps.fullTextIndexer.syncAll({
        afterId: resumeFrom?.fileId,
        onBatch: ({ indexed, lastFileId: fid, total }) => {
          fullTextIndexed = indexed;
          lastFileId = fid;
          fullTextToIndex = total;
          notifyIndexing();
        },
      }),
    ]);
  }

  async execute(resumeFrom?: ResumeFrom): Promise<void> {
    this.notify({ stage: 'bootstrap-slots' });
    await this.deps.slotsBootstrapper.execute();

    this.notify({ stage: 'reconcile-slots' });
    await this.deps.transactionManager.run(async () => this.deps.slotsReconciler.execute());

    await this.indexInParallel(resumeFrom);

    this.notify({ stage: 'done' });
  }
}

export { TenantOnboarder };
export type { ProgressEvent, ResumeFrom, Deps as TenantOnboarderDeps };
