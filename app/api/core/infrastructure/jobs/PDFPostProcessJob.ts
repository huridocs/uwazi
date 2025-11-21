import { WebSockets } from 'api/core/application/contracts/WebSockets';
import { PDFPostProcess } from 'api/core/application/PDFPostProcess';
import { HeartbeatCallback, JobInfo } from 'api/core/libs/queue/application/contracts/Dispatchable';
import { NonRetryableJobError } from 'api/core/libs/queue/infrastructure/errors';
import { FileMappers } from 'api/core/infrastructure/mongodb/files/FilesMappers';
import { ProcessingFileFailed, ProcessingFileNotFound } from 'api/files.v2/model/errors';
import { V1CompatTenantDispatchable } from 'api/core/libs/queue/application/contracts/V1CompatTenantDispatchable';
import { FileIsNotAPDF } from '../services/PDFService';

type Params = {
  documentId: string;
};

type JobDependencies = {
  useCase: PDFPostProcess;
  wSockets: WebSockets;
};

class PDFPostProcessJob extends V1CompatTenantDispatchable<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  async handle(_heartbeat: HeartbeatCallback, params: Params, jobInfo: JobInfo) {
    try {
      const processedDoc = await this.deps.useCase.execute(
        params,
        jobInfo.retryCount !== jobInfo.maxRetries
      );
      this.deps.wSockets.emitToTenant(
        jobInfo.namespace,
        'documentProcessed',
        processedDoc.entity,
        FileMappers.toDTO(processedDoc)
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
            FileMappers.toDTO(e.file)
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

export { PDFPostProcessJob };
