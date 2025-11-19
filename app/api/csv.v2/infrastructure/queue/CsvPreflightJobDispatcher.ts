import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from 'api/core/libs/queue/application/contracts/UserAwareDispatchable';
import { HeartbeatCallback, JobInfo } from 'api/core/libs/queue/application/contracts/Dispatchable';
import { V1WebSocketsWrapper } from 'api/core/infrastructure/services/V1WebSocketsWrapper';
import { CsvPreflightJob } from '../../application/jobs/CsvPreflightJob';

type Params = UserAwareDispatchableParams & {
  importId: string;
  sessionId?: string;
};

type Deps = {
  useCase: CsvPreflightJob;
  sockets: V1WebSocketsWrapper;
};

export class CsvPreflightJobDispatcher extends UserAwareDispatchable<Params> {
  constructor(private deps: Deps) {
    super();
  }

  async handle(_heartbeat: HeartbeatCallback, jobInfo?: JobInfo): Promise<void> {
    try {
      await this.deps.useCase.execute({
        importId: this.params.importId,
        callbacks: {
          onStart: ({ importId }: { importId: string }) => {
            if (this.params.sessionId) {
              this.deps.sockets.emitToSession(
                this.params.sessionId,
                'csvImport:preflight:thesauri:start',
                { importId }
              );
            }
          },
          onSuccess: ({ importId }: { importId: string }) => {
            if (this.params.sessionId) {
              this.deps.sockets.emitToSession(
                this.params.sessionId,
                'csvImport:preflight:thesauri:success',
                { importId }
              );
            }
          },
          onError: ({ importId, error }: { importId: string; error: Error }) => {
            if (this.params.sessionId) {
              this.deps.sockets.emitToSession(
                this.params.sessionId,
                'csvImport:preflight:thesauri:error',
                { importId, message: error.message }
              );
            }
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
