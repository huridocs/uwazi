import {
  Dispatcher,
  SyncRelationshipsParams,
  CleanupEntityParams,
  PDFPostProcessParams,
  TemplatePostProcessParams,
  DenormalizeThesaurusParams,
} from '#api/core/application/contracts/Dispatcher.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { BulkCleanupEntityJob } from './BulkCleanupEntityJob.js';
import { DeleteFileFromStorageJobHandler } from './DeleteFileFromStorageJobHandler.js';
import { DenormalizeThesaurusEntitiesHandler } from './DenormalizeThesaurusEntitiesHandler.js';
import { PDFPostProcessJobHandler } from './PDFPostProcessJobHandler.js';
import { RelationshipSyncJob } from './RelationshipSyncJob.js';
import { TemplatePostProcessEntitiesJob } from './TemplatePostProcessEntitiesJob.js';

class DispatcherAdapter implements Dispatcher {
  constructor(private jobsDispatcher: JobsDispatcher) {}

  async syncRelationships(items: SyncRelationshipsParams[]): Promise<void> {
    await this.jobsDispatcher.dispatchMany(dispatch => {
      items.forEach(p => dispatch(RelationshipSyncJob, p));
    });
  }

  async cleanupEntities(chunks: CleanupEntityParams[]): Promise<void> {
    await this.jobsDispatcher.dispatchMany(dispatch => {
      chunks.forEach(c => dispatch(BulkCleanupEntityJob, c));
    });
  }

  async postProcessPDFs(items: PDFPostProcessParams[]): Promise<void> {
    await this.jobsDispatcher.dispatchMany(dispatch => {
      items.forEach(p => dispatch(PDFPostProcessJobHandler, p));
    });
  }

  async deleteFilesFromStorage(paths: string[]): Promise<void> {
    await this.jobsDispatcher.dispatchMany(dispatch => {
      paths.forEach(p => dispatch(DeleteFileFromStorageJobHandler, { filePath: p }));
    });
  }

  async postProcessTemplateEntities(
    callback: (dispatch: (params: TemplatePostProcessParams) => void) => void | Promise<void>
  ): Promise<void> {
    await this.jobsDispatcher.dispatchMany(async dispatch =>
      callback(params => dispatch(TemplatePostProcessEntitiesJob, params))
    );
  }

  async denormalizeThesaurus(params: DenormalizeThesaurusParams): Promise<void> {
    await this.jobsDispatcher.deleteByParams(DenormalizeThesaurusEntitiesHandler, {
      thesaurusId: params.thesaurusId,
    });
    await this.jobsDispatcher.dispatch(DenormalizeThesaurusEntitiesHandler, params);
  }
}

export { DispatcherAdapter };
