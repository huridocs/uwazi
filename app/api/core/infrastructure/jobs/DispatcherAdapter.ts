import {
  Dispatcher,
  SyncRelationshipsParams,
  CleanupEntityParams,
  PDFPostProcessParams,
  TemplatePostProcessParams,
} from '#api/core/application/contracts/Dispatcher.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { BulkCleanupEntityJob } from './BulkCleanupEntityJob.js';
import { DeleteFileFromStorageJobHandler } from './DeleteFileFromStorageJobHandler.js';
import { PDFPostProcessJobHandler } from './PDFPostProcessJobHandler.js';
import { RelationshipSyncJob } from './RelationshipSyncJob.js';
import { TemplatePostProcessEntitiesJob } from './TemplatePostProcessEntitiesJob.js';

class DispatcherAdapter implements Dispatcher {
  constructor(private jobsDispatcher: JobsDispatcher) {}

  async syncRelationships(items: SyncRelationshipsParams[]): Promise<void> {
    await this.jobsDispatcher.dispatchMany(async dispatch => {
      items.forEach(p => dispatch(RelationshipSyncJob, p));
    });
  }

  async cleanupEntities(chunks: CleanupEntityParams[]): Promise<void> {
    await this.jobsDispatcher.dispatchMany(async dispatch => {
      chunks.forEach(c => dispatch(BulkCleanupEntityJob, c));
    });
  }

  async postProcessPDFs(items: PDFPostProcessParams[]): Promise<void> {
    await this.jobsDispatcher.dispatchMany(async dispatch => {
      items.forEach(p => dispatch(PDFPostProcessJobHandler, p));
    });
  }

  async deleteFilesFromStorage(paths: string[]): Promise<void> {
    await this.jobsDispatcher.dispatchMany(async dispatch => {
      paths.forEach(p => dispatch(DeleteFileFromStorageJobHandler, { filePath: p }));
    });
  }

  async postProcessTemplateEntities(items: TemplatePostProcessParams[]): Promise<void> {
    await this.jobsDispatcher.dispatchMany(async dispatch => {
      items.forEach(p => dispatch(TemplatePostProcessEntitiesJob, p));
    });
  }
}

export { DispatcherAdapter };
