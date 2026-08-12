import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import {
  HeartbeatCallback,
  JobInfo,
  Params as DispatchableParams,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { V1WebSocketsWrapper } from '#api/core/infrastructure/services/V1WebSocketsWrapper.js';
import { CsvPreflightJob } from '../../application/jobs/CsvPreflightJob.js';
import {
  dispatchCleanupAfterCancelledStage,
  handleTerminalFailureCleanup,
} from './CsvCleanupDispatch.js';

type Params = UwaziJobParams & {
  tenantName: string;
  importId: string;
};

type Deps = {
  useCase: CsvPreflightJob;
  sockets: V1WebSocketsWrapper;
};

export class CsvPreflightJobHandler extends UwaziJobHandler<Params> {
  constructor(private deps: Deps) {
    super();
  }

  private static parseParams(params: DispatchableParams): Params {
    const { importId, tenantName, userId } = params;
    if (typeof importId !== 'string') {
      throw new Error('CsvPreflightJobHandler requires params.importId:string');
    }
    if (typeof tenantName !== 'string') {
      throw new Error('CsvPreflightJobHandler requires params.tenantName:string');
    }
    if (typeof userId !== 'string') {
      throw new Error('CsvPreflightJobHandler requires params.userId:string');
    }
    return { importId, tenantName, userId };
  }

  async handleDispatch(
    heartbeat: HeartbeatCallback,
    params: DispatchableParams,
    jobInfo?: JobInfo
  ): Promise<void> {
    return super.handleDispatch(heartbeat, CsvPreflightJobHandler.parseParams(params), jobInfo);
  }

  async handle(heartbeat: HeartbeatCallback, params: Params, jobInfo?: JobInfo): Promise<void> {
    const { tenantName } = params;

    try {
      await this.deps.useCase.execute({
        importId: params.importId,
        tenantName,
        userId: params.userId,
        callbacks: {
          onStart: ({ importId }: { importId: string }) => {
            this.deps.sockets.emitToTenantAdmins(tenantName, 'csvImport:preflight:scan:start', {
              importId,
            });
          },
          onProgress: ({ importId, processedRows, totalRows }) => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            heartbeat();
            this.deps.sockets.emitToTenantAdmins(tenantName, 'csvImport:preflight:scan:progress', {
              importId,
              processedRows,
              totalRows,
            });
          },
          onSuccess: ({ importId }: { importId: string }) => {
            this.deps.sockets.emitToTenantAdmins(tenantName, 'csvImport:preflight:scan:success', {
              importId,
            });
          },
          onError: ({ importId, error }: { importId: string; error: Error }) => {
            this.deps.sockets.emitToTenantAdmins(tenantName, 'csvImport:preflight:scan:error', {
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
    } catch (e) {
      await handleTerminalFailureCleanup({
        useCase: this.deps.useCase,
        importId: params.importId,
        tenantName,
        userId: params.userId,
        error: e,
        jobInfo,
      });
      throw e;
    }
  }
}
