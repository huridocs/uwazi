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
  CsvCreateRelationshipEntitiesJob,
  RelationshipsProgress,
} from '../../application/jobs/CsvCreateRelationshipEntitiesJob.js';
import { CsvV1CompatEmitter } from '../services/CsvV1CompatEmitter.js';

type Params = UserAwareDispatchableParams & {
  importId: string;
};

type Deps = {
  useCase: CsvCreateRelationshipEntitiesJob;
  sockets: V1WebSocketsWrapper;
  v1Compat?: CsvV1CompatEmitter;
};

export class CsvCreateRelationshipEntitiesJobHandler extends UserAwareDispatchable<Params> {
  constructor(private deps: Deps) {
    super();
  }

  private static parseParams(params: DispatchableParams): Params {
    const { importId, tenantName, userId } = params;
    if (typeof importId !== 'string') {
      throw new Error('CsvCreateRelationshipEntitiesJobHandler requires params.importId:string');
    }
    if (typeof tenantName !== 'string') {
      throw new Error('CsvCreateRelationshipEntitiesJobHandler requires params.tenantName:string');
    }
    if (typeof userId !== 'string') {
      throw new Error('CsvCreateRelationshipEntitiesJobHandler requires params.userId:string');
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
      CsvCreateRelationshipEntitiesJobHandler.parseParams(params),
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
          onStart: ({ importId }) => {
            this.deps.sockets.emitToTenantAdmins(
              tenantName,
              'csvImport:preflight:relationships:create:start',
              { importId }
            );
          },
          onProgress: (info: RelationshipsProgress) => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            heartbeat();
            this.deps.sockets.emitToTenantAdmins(
              tenantName,
              'csvImport:preflight:relationships:create:progress',
              {
                importId: info.importId,
                processedTemplates: info.processedTemplates,
                totalTemplates: info.totalTemplates,
                createdEntities: info.createdEntities,
              }
            );
          },
          onSuccess: ({ importId }) => {
            this.deps.sockets.emitToTenantAdmins(
              tenantName,
              'csvImport:preflight:relationships:create:success',
              { importId }
            );
          },
          onError: ({ importId, error }: { importId: string; error: Error }) => {
            this.deps.v1Compat?.error(tenantName, error);
            this.deps.sockets.emitToTenantAdmins(
              tenantName,
              'csvImport:preflight:relationships:create:error',
              { importId, message: error.message }
            );
          },
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      heartbeat();
    } catch (error) {
      if (jobInfo && jobInfo.retryCount + 1 >= jobInfo.maxRetries) {
        await this.deps.useCase.markAsFailed(this.params.importId);
      }
      throw error;
    }
  }
}
