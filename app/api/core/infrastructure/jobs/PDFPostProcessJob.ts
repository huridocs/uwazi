import { WebSockets } from 'api/core/application/contracts/WebSockets';
import { PDFPostProcess } from 'api/core/application/PDFPostProcess';
import { HeartbeatCallback, JobInfo } from 'api/core/libs/queue/application/contracts/Dispatchable';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from 'api/core/libs/queue/application/contracts/UserAwareDispatchable';
import { NonRetryableJobError } from 'api/core/libs/queue/infrastructure/errors';
import { FileMappers } from 'api/files.v2/database/FilesMappers';
import { ProcessingFileFailed, ProcessingFileNotFound } from 'api/files.v2/model/errors';

type Params = UserAwareDispatchableParams & {
  documentId: string;
};

type JobDependencies = {
  useCase: PDFPostProcess;
  wSockets: WebSockets;
};

class PDFPostProcessJob extends UserAwareDispatchable<Params> {
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
        this.params.tenantName,
        'documentProcessed',
        processedDoc.entity,
        FileMappers.toDTO(processedDoc)
      );
    } catch (e) {
      if (e instanceof ProcessingFileNotFound) {
        throw new NonRetryableJobError(e);
      }

      if (e instanceof ProcessingFileFailed && jobInfo.maxRetries === jobInfo.retryCount) {
        this.deps.wSockets.emitToTenant(
          this.params.tenantName,
          'conversionFailed',
          e.file.entity,
          FileMappers.toDTO(e.file)
        );
      }

      throw e;
    }
  }
}

export { PDFPostProcessJob };
