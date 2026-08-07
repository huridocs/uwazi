import { WebSockets } from '#api/core/application/contracts/WebSockets.js';
import { PDFPostProcessJob } from '#api/core/application/PDFPostProcessJob.js';
import { ProcessingFileFailed, ProcessingFileNotFound } from '#api/core/domain/files/errors.js';
import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { FileIsNotAPDF } from '../services/PDFService.js';

import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';

type Params = UserAwareDispatchableParams & {
  documentId: string;
  sessionId?: string;
};

type JobDependencies = {
  useCase: PDFPostProcessJob;
  wSockets: WebSockets;
};

export class PDFPostProcessJobHandler extends UserAwareDispatchable<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  async handle(_heartbeat: HeartbeatCallback, jobInfo: JobInfo) {
    try {
      const processedDoc = await this.deps.useCase.execute(
        this.params,
        jobInfo.retryCount !== jobInfo.maxRetries
      );
      this.emitToUploaderSession('documentProcessed', processedDoc.entity);
    } catch (e) {
      this.handleProcessingError(e, jobInfo);
    }
  }

  private emitToUploaderSession(event: 'documentProcessed' | 'conversionFailed', entityId: string) {
    if (!this.params.sessionId) {
      return;
    }
    this.deps.wSockets.emitToSession(this.params.sessionId, event, entityId);
  }

  private handleProcessingError(e: unknown, jobInfo: JobInfo): never {
    if (e instanceof ProcessingFileNotFound) {
      throw new NonRetryableJobError(e);
    }

    if (e instanceof ProcessingFileFailed) {
      const shouldNotifyFailure =
        jobInfo.maxRetries === jobInfo.retryCount || e.cause instanceof FileIsNotAPDF;
      if (shouldNotifyFailure) {
        this.emitToUploaderSession('conversionFailed', e.file.entity);
      }
      if (e.cause instanceof FileIsNotAPDF) {
        throw new NonRetryableJobError(e);
      }
    }

    throw e;
  }
}
