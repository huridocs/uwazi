import { WebSockets } from '#api/core/application/contracts/WebSockets.js';
import { PDFPostProcessJob } from '#api/core/application/PDFPostProcessJob.js';
import { ProcessingFileFailed, ProcessingFileNotFound } from '#api/core/domain/files/errors.js';
import { HeartbeatCallback, JobInfo } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { FileIsNotAPDF } from '#api/core/infrastructure/services/PDFService.js';

import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';

type Params = UserAwareDispatchableParams & {
  documentId: string;
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
      this.deps.wSockets.emitToTenant(
        jobInfo.namespace,
        'documentProcessed',
        processedDoc.entity,
        processedDoc.toDTO()
      );
    } catch (e) {
      if (e instanceof ProcessingFileNotFound) {
        throw new NonRetryableJobError(e);
      }

      if (e instanceof ProcessingFileFailed) {
        if (jobInfo.maxRetries === jobInfo.retryCount || e.cause instanceof FileIsNotAPDF) {
          this.deps.wSockets.emitToTenant(
            jobInfo.namespace,
            'conversionFailed',
            e.file.entity,
            e.file.toDTO()
          );
        }
        if (e.cause instanceof FileIsNotAPDF) {
          throw new NonRetryableJobError(e);
        }
      }

      throw e;
    }
  }
}
