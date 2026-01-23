import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { V1WebSocketsWrapper } from '#api/core/infrastructure/services/V1WebSocketsWrapper.js';
import {
  CsvExtractUploadedZipJob,
  ExtractionProgress,
} from '#api/csv.v2/application/jobs/CsvExtractUploadedZipJob.js';

type Params = UserAwareDispatchableParams & {
  importId: string;
};

type Deps = {
  useCase: CsvExtractUploadedZipJob;
  sockets: V1WebSocketsWrapper;
};

export class CsvExtractUploadedZipJobHandler extends UserAwareDispatchable<Params> {
  constructor(private deps: Deps) {
    super();
  }

  async handle(heartbeat: HeartbeatCallback, jobInfo?: JobInfo): Promise<void> {
    const { tenantName } = this;

    try {
      await this.deps.useCase.execute({
        importId: this.params.importId,
        tenantName,
        userId: this.params.userId,
        callbacks: {
          onStart: ({ importId }: { importId: string }) => {
            this.deps.sockets.emitToTenantAdmins(tenantName, 'csvImport:extract:start', {
              importId,
            });
          },
          onProgress: (info: ExtractionProgress) => {
            // Renew lock while making progress
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            heartbeat();
            if (info.type === 'files') {
              this.deps.sockets.emitToTenantAdmins(tenantName, 'csvImport:extract:progress', {
                importId: info.importId,
                stage: 'files',
                processedFiles: info.processedFiles,
              });
              return;
            }
            this.deps.sockets.emitToTenantAdmins(tenantName, 'csvImport:extract:progress', {
              importId: info.importId,
              stage: 'rows',
              stagedRows: info.stagedRows,
            });
          },
          onSuccess: ({ importId }: { importId: string }) => {
            this.deps.sockets.emitToTenantAdmins(tenantName, 'csvImport:extract:success', {
              importId,
            });
          },
          onError: ({ importId, error }: { importId: string; error: Error }) => {
            this.deps.sockets.emitToTenantAdmins(tenantName, 'csvImport:extract:error', {
              importId,
              message: error.message,
            });
          },
        },
      });
    } catch (e) {
      // If this was the last retry attempt, mark as definitively failed.
      if (jobInfo && jobInfo.retryCount + 1 >= jobInfo.maxRetries) {
        await this.deps.useCase.markAsFailed(this.params.importId);
      }
      throw e;
    }
  }
}
