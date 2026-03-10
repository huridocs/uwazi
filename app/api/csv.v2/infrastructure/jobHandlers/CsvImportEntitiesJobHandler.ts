import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { V1WebSocketsWrapper } from '#api/core/infrastructure/services/V1WebSocketsWrapper.js';
import { CsvImportEntitiesJob } from '../../application/jobs/CsvImportEntitiesJob';
import { CsvV1CompatEmitter } from '../services/CsvV1CompatEmitter.js';

type Params = UserAwareDispatchableParams & {
  importId: string;
};

type Deps = {
  useCase: CsvImportEntitiesJob;
  sockets: V1WebSocketsWrapper;
  v1Compat?: CsvV1CompatEmitter;
};

export class CsvImportEntitiesJobHandler extends UserAwareDispatchable<Params> {
  constructor(private deps: Deps) {
    super();
  }

  async handle(heartbeat: HeartbeatCallback, jobInfo?: JobInfo): Promise<void> {
    const { tenantName } = this;
    let v1LoadedCount = 0;

    try {
      await this.deps.useCase.execute({
        importId: this.params.importId,
        callbacks: {
          onStart: ({ importId }) => {
            this.deps.v1Compat?.start(tenantName);
            this.deps.sockets.emitToTenantAdmins(tenantName, 'csvImport:import:start', {
              importId,
            });
          },
          onSuccess: ({ importId }) => {
            const { v1Compat } = this.deps;
            if (v1Compat) {
              v1Compat
                .rowExceptions(tenantName, importId)
                .catch(() => undefined)
                .finally(() => v1Compat.end(tenantName));
            }
            this.deps.sockets.emitToTenantAdmins(tenantName, 'csvImport:import:success', {
              importId,
            });
          },
          onProgress: info => {
            v1LoadedCount += info.entitiesCreatedInBatch;
            this.deps.v1Compat?.progress(tenantName, v1LoadedCount);
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
            this.deps.v1Compat?.error(tenantName, error);
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
