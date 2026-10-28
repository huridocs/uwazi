import { WebSockets } from '#api/core/application/contracts/WebSockets.js';
import { PDFPostProcessJob } from '#api/core/application/PDFPostProcessJob.js';
import { ProcessingFileFailed, ProcessingFileNotFound } from '#api/core/domain/files/errors.js';
import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { FileIsNotAPDF } from '../services/PDFService.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';

type Params = UwaziJobParams & {
  documentId: string;
};

type JobDependencies = {
  useCase: PDFPostProcessJob;
  wSockets: WebSockets;
  /** The uploader's session, restored by the queue worker from the job that was dispatched. */
  sessionId?: string;
};

@PrivilegedJob()
export class PDFPostProcessJobHandler extends UwaziJobHandler<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  async handle(_heartbeat: HeartbeatCallback, params: Params, jobInfo: JobInfo) {
    try {
      const processedDoc = await this.deps.useCase.execute(
        params,
        jobInfo.retryCount !== jobInfo.maxRetries
      );
      if (this.deps.sessionId) {
        this.deps.wSockets.emitToSession(
          this.deps.sessionId,
          'documentProcessed',
          processedDoc.entity
        );
      }
    } catch (e) {
      this.handleError(e, jobInfo);
    }
  }

  private handleError(e: any, jobInfo: JobInfo) {
    if (e instanceof ProcessingFileNotFound) {
      throw new NonRetryableJobError(e);
    }

    if (e instanceof ProcessingFileFailed) {
      const shouldNotifyFailure =
        jobInfo.maxRetries === jobInfo.retryCount || e.cause instanceof FileIsNotAPDF;
      if (shouldNotifyFailure && this.deps.sessionId) {
        this.deps.wSockets.emitToSession(this.deps.sessionId, 'conversionFailed', e.file.entity);
      }
      if (e.cause instanceof FileIsNotAPDF) {
        throw new NonRetryableJobError(e);
      }
    }

    throw e;
  }
}
