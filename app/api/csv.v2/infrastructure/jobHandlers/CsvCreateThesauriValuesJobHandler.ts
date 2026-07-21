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
  CsvCreateThesauriValuesJob,
  ThesauriCreationProgress,
} from '../../application/jobs/CsvCreateThesauriValuesJob.js';
import {
  dispatchCleanupAfterCancelledStage,
  handleTerminalFailureCleanup,
} from './CsvCleanupDispatch.js';

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

  private static parseParams(params: DispatchableParams): Params {
    const { importId, tenantName, userId } = params;
    if (typeof importId !== 'string') {
      throw new Error('CsvCreateThesauriValuesJobHandler requires params.importId:string');
    }
    if (typeof tenantName !== 'string') {
      throw new Error('CsvCreateThesauriValuesJobHandler requires params.tenantName:string');
    }
    if (typeof userId !== 'string') {
      throw new Error('CsvCreateThesauriValuesJobHandler requires params.userId:string');
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
      CsvCreateThesauriValuesJobHandler.parseParams(params),
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
