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
import {
  CsvExtractUploadedZipJob,
  ExtractionProgress,
} from '../../application/jobs/CsvExtractUploadedZipJob.js';
import { CsvV1CompatEmitter } from '../services/CsvV1CompatEmitter.js';
import {
  dispatchCleanupAfterCancelledStage,
  handleTerminalFailureCleanup,
} from './CsvCleanupDispatch.js';

type Params = UserAwareDispatchableParams & {
  importId: string;
};

type Deps = {
  useCase: CsvExtractUploadedZipJob;
  sockets: V1WebSocketsWrapper;
  v1Compat?: CsvV1CompatEmitter;
};

export class CsvExtractUploadedZipJobHandler extends UserAwareDispatchable<Params> {
  constructor(private deps: Deps) {
    super();
  }

  private static parseParams(params: DispatchableParams): Params {
    const { importId, tenantName, userId } = params;
    if (typeof importId !== 'string') {
      throw new Error('CsvExtractUploadedZipJobHandler requires params.importId:string');
    }
    if (typeof tenantName !== 'string') {
      throw new Error('CsvExtractUploadedZipJobHandler requires params.tenantName:string');
    }
    if (typeof userId !== 'string') {
      throw new Error('CsvExtractUploadedZipJobHandler requires params.userId:string');
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
      CsvExtractUploadedZipJobHandler.parseParams(params),
      jobInfo
    );
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
            this.deps.v1Compat?.start(tenantName);
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
            this.deps.v1Compat?.error(tenantName, error);
            this.deps.sockets.emitToTenantAdmins(tenantName, 'csvImport:extract:error', {
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
    } catch (e) {
      await handleTerminalFailureCleanup({
        useCase: this.deps.useCase,
        importId: this.params.importId,
        tenantName,
        userId: this.params.userId,
        error: e,
        jobInfo,
      });
      throw e;
    }
  }
}
