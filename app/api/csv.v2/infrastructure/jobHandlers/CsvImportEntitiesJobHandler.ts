import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import {
  HeartbeatCallback,
  JobInfo,
  Params as DispatchableParams,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { V1WebSocketsWrapper } from '#api/core/infrastructure/services/V1WebSocketsWrapper.js';
import { CsvImportEntitiesJob } from '../../application/jobs/CsvImportEntitiesJob.js';
import {
  dispatchCleanupAfterCancelledStage,
  handleTerminalFailureCleanup,
} from './CsvCleanupDispatch.js';

type Params = UwaziJobParams & {
  tenantName: string;
  importId: string;
};

type Deps = {
  useCase: CsvImportEntitiesJob;
  sockets: V1WebSocketsWrapper;
};

export class CsvImportEntitiesJobHandler extends UwaziJobHandler<Params> {
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

  async handle(heartbeat: HeartbeatCallback, params: Params, jobInfo?: JobInfo): Promise<void> {
    const { tenantName } = params;

    try {
      await this.deps.useCase.execute({
        importId: params.importId,
        tenantName,
        userId: params.userId,
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
              entitiesUpdatedInBatch: info.entitiesUpdatedInBatch,
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
      await dispatchCleanupAfterCancelledStage({
        useCase: this.deps.useCase,
        importId: params.importId,
        tenantName,
        userId: params.userId,
      });
    } catch (error) {
      await handleTerminalFailureCleanup({
        useCase: this.deps.useCase,
        importId: params.importId,
        tenantName,
        userId: params.userId,
        error,
        jobInfo,
      });
      throw error;
    }
  }
}
