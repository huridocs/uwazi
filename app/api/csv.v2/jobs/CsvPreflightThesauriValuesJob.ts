import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from 'api/core/libs/queue/application/contracts/UserAwareDispatchable';
import { HeartbeatCallback } from 'api/core/libs/queue/application/contracts/Dispatchable';
import { V1WebSocketsWrapper } from 'api/core/infrastructure/services/V1WebSocketsWrapper';
import { CsvPreflightThesauriValuesUseCase } from '../services/CsvPreflightThesauriValuesUseCase';

type Params = UserAwareDispatchableParams & {
  importId: string;
  sessionId?: string;
};

type Deps = {
  useCase: CsvPreflightThesauriValuesUseCase;
  sockets: V1WebSocketsWrapper;
};

export class CsvPreflightThesauriValuesJob extends UserAwareDispatchable<Params> {
  constructor(private deps: Deps) {
    super();
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  async handle(_heartbeat: HeartbeatCallback): Promise<void> {
    const { importId, sessionId } = this.params;
    await this.deps.useCase.execute(
      { importId, sessionId },
      {
        onStart: ({ importId: id, sessionId: sid }) => {
          if (sid) {
            this.deps.sockets.emitToSession(sid, 'csvImport:preflight:thesauri:start', {
              importId: id,
            });
          }
        },
        onSuccess: ({ importId: id, sessionId: sid }) => {
          if (sid) {
            this.deps.sockets.emitToSession(sid, 'csvImport:preflight:thesauri:success', {
              importId: id,
            });
          }
        },
        onError: ({ importId: id, error, sessionId: sid }) => {
          if (sid) {
            this.deps.sockets.emitToSession(sid, 'csvImport:preflight:thesauri:error', {
              importId: id,
              message: error.message,
            });
          }
        },
      }
    );
  }
}
