import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from 'api/core/libs/queue/application/contracts/UserAwareDispatchable';
import { HeartbeatCallback, JobInfo } from 'api/core/libs/queue/application/contracts/Dispatchable';
import { WorkerSockets } from 'api/core/infrastructure/services/WorkerSockets';
import { CsvExtractUploadedZipUseCase } from '../services/CsvExtractUploadedZipUseCase';

type Params = UserAwareDispatchableParams & {
  importId: string;
  sessionId?: string;
};

type Deps = {
  useCase: CsvExtractUploadedZipUseCase;
  sockets: WorkerSockets;
};

export class CsvExtractUploadedZipJob extends UserAwareDispatchable<Params> {
  constructor(private deps: Deps) {
    super();
  }

  async handle(heartbeat: HeartbeatCallback, _jobInfo?: JobInfo): Promise<void> {
    await this.deps.useCase.execute(
      { importId: this.params.importId },
      {
        onStart: ({ importId }: { importId: string }) => {
          if (this.params.sessionId) {
            this.deps.sockets.emitToSession(this.params.sessionId, 'csvImport:extract:start', {
              importId,
            });
          }
        },
        onProgress: ({
          importId,
          processedFiles,
        }: {
          importId: string;
          processedFiles: number;
        }) => {
          // Renew lock while making progress
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          heartbeat();
          if (this.params.sessionId) {
            this.deps.sockets.emitToSession(this.params.sessionId, 'csvImport:extract:progress', {
              importId,
              processedFiles,
            });
          }
        },
        onSuccess: ({ importId }: { importId: string }) => {
          if (this.params.sessionId) {
            this.deps.sockets.emitToSession(this.params.sessionId, 'csvImport:extract:success', {
              importId,
            });
          }
        },
        onError: ({ importId, error }: { importId: string; error: Error }) => {
          if (this.params.sessionId) {
            this.deps.sockets.emitToSession(this.params.sessionId, 'csvImport:extract:error', {
              importId,
              message: error.message,
            });
          }
        },
      }
    );
  }
}
