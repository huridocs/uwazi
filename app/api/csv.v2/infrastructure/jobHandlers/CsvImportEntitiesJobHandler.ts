import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from 'api/core/libs/queue/application/contracts/UserAwareDispatchable';
import { HeartbeatCallback, JobInfo } from 'api/core/libs/queue/application/contracts/Dispatchable';
import { V1WebSocketsWrapper } from 'api/core/infrastructure/services/V1WebSocketsWrapper';
import { CsvImportEntitiesJob } from '../../application/jobs/CsvImportEntitiesJob';

type Params = UserAwareDispatchableParams & {
  importId: string;
};

type Deps = {
  useCase: CsvImportEntitiesJob;
  sockets: V1WebSocketsWrapper;
};

export class CsvImportEntitiesJobHandler extends UserAwareDispatchable<Params> {
  constructor(private deps: Deps) {
    super();
  }

  async handle(heartbeat: HeartbeatCallback, jobInfo?: JobInfo): Promise<void> {
    const { tenantName } = this;

    try {
      await this.deps.useCase.execute({
        importId: this.params.importId,
        callbacks: {
          onStart: ({ importId }) => {
            this.deps.sockets.emitToTenantAdmins(tenantName, 'csvImport:import:start', {
              importId,
            });
          },
          onSuccess: ({ importId }) => {
            this.deps.sockets.emitToTenantAdmins(tenantName, 'csvImport:import:success', {
              importId,
            });
          },
          onProgress: info => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            heartbeat();
            this.deps.sockets.emitToTenantAdmins(tenantName, 'csvImport:import:progress', {
              importId: info.importId,
              processedRows: info.processedRows,
              totalRows: info.totalRows,
              batchIndex: info.batchIndex,
              batchCount: info.batchCount,
              entitiesCreatedInBatch: info.entitiesCreatedInBatch,
            });
          },
          onError: ({ importId, error }: { importId: string; error: Error }) => {
            this.deps.sockets.emitToTenantAdmins(tenantName, 'csvImport:import:error', {
              importId,
              message: error.message,
            });
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
