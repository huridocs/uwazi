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
  CsvCreateThesauriValuesJob,
  ThesauriCreationProgress,
} from '#api/csv.v2/application/jobs/CsvCreateThesauriValuesJob.js';

type Params = UserAwareDispatchableParams & {
  importId: string;
};

type Deps = {
  useCase: CsvCreateThesauriValuesJob;
  sockets: V1WebSocketsWrapper;
};

export class CsvCreateThesauriValuesJobHandler extends UserAwareDispatchable<Params> {
  constructor(private deps: Deps) {
    super();
  }

  async handle(heartbeat: HeartbeatCallback, jobInfo?: JobInfo): Promise<void> {
    const { tenantName } = this;

    try {
      await this.deps.useCase.execute({
        importId: this.params.importId,
        callbacks: {
          onStart: ({ importId }: { importId: string }) => {
            this.deps.sockets.emitToTenantAdmins(
              tenantName,
              'csvImport:preflight:thesauri:create:start',
              { importId }
            );
          },
          onProgress: (info: ThesauriCreationProgress) => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            heartbeat();
            this.deps.sockets.emitToTenantAdmins(
              tenantName,
              'csvImport:preflight:thesauri:create:progress',
              {
                importId: info.importId,
                thesaurusId: info.thesaurusId,
                processedThesauri: info.processedThesauri,
                totalThesauri: info.totalThesauri,
                createdValues: info.createdValues,
              }
            );
          },
          onSuccess: ({ importId }: { importId: string }) => {
            this.deps.sockets.emitToTenantAdmins(
              tenantName,
              'csvImport:preflight:thesauri:create:success',
              { importId }
            );
          },
          onError: ({ importId, error }: { importId: string; error: Error }) => {
            this.deps.sockets.emitToTenantAdmins(
              tenantName,
              'csvImport:preflight:thesauri:create:error',
              { importId, message: error.message }
            );
          },
        },
      });
    } catch (error) {
      if (jobInfo && jobInfo.retryCount + 1 >= jobInfo.maxRetries) {
        await this.deps.useCase.markAsFailed(this.params.importId);
      }
      throw error;
    }
  }
}
