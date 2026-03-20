import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import {
  HeartbeatCallback,
  JobInfo,
  Params as DispatchableParams,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { V1WebSocketsWrapper } from '#api/core/infrastructure/services/V1WebSocketsWrapper.js';
import { CsvImportEntitiesJob } from '../../application/jobs/CsvImportEntitiesJob.js';
import { CsvV1CompatEmitter } from '../services/CsvV1CompatEmitter.js';
import {
  dispatchCleanupAfterCancelledStage,
  handleTerminalFailureCleanup,
} from './CsvCleanupDispatch.js';

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

  private static parseParams(params: DispatchableParams): Params {
    const { importId, tenantName, userId } = params;
    if (typeof importId !== 'string') {
      throw new Error('CsvImportEntitiesJobHandler requires params.importId:string');
    }
    if (typeof tenantName !== 'string') {
      throw new Error('CsvImportEntitiesJobHandler requires params.tenantName:string');
    }
    if (typeof userId !== 'string') {
      throw new Error('CsvImportEntitiesJobHandler requires params.userId:string');
    }
    return { importId, tenantName, userId };
  }

  async handleDispatch(
    heartbeat: HeartbeatCallback,
    params: DispatchableParams,
    jobInfo?: JobInfo
  ): Promise<void> {
    return super.handleDispatch(
      heartbeat,
      CsvImportEntitiesJobHandler.parseParams(params),
      jobInfo
    );
  }

  async handle(heartbeat: HeartbeatCallback, jobInfo?: JobInfo): Promise<void> {
    const { tenantName } = this;
    let v1LoadedCount = 0;

    try {
      await this.deps.useCase.execute({
        importId: this.params.importId,
        tenantName,
        userId: this.params.userId,
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
      await dispatchCleanupAfterCancelledStage({
        useCase: this.deps.useCase,
        importId: this.params.importId,
        tenantName,
        userId: this.params.userId,
      });
    } catch (error) {
      await handleTerminalFailureCleanup({
        useCase: this.deps.useCase,
        importId: this.params.importId,
        tenantName,
        userId: this.params.userId,
        error,
        jobInfo,
      });
      throw error;
    }
  }
}
