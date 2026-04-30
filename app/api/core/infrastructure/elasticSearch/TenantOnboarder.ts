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

  async execute(resumeFrom?: ResumeFrom): Promise<void> {
    this.notify({ stage: 'bootstrap-slots' });
    await this.deps.slotsBootstrapper.execute();

    this.notify({ stage: 'reconcile-slots' });
    await this.deps.transactionManager.run(async () => this.deps.slotsReconciler.execute());

    await this.deps.entityIndexer.syncAll({
      afterSharedId: resumeFrom?.entitySharedId,
      onBatch: ({ indexed, lastSharedId }) =>
        this.notify({ stage: 'index-entities', indexed, lastSharedId }),
    });

    await this.deps.fullTextIndexer.syncAll({
      afterId: resumeFrom?.fileId,
      onBatch: ({ indexed, lastFileId }) =>
        this.notify({ stage: 'index-fulltext', indexed, lastFileId }),
    });

    this.notify({ stage: 'done' });
  }
}

export { TenantOnboarder };
export type { ProgressEvent, ResumeFrom, Deps as TenantOnboarderDeps };
