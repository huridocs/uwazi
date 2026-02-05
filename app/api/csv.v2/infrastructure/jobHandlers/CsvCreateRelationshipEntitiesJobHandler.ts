import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from 'api/core/libs/queue/application/contracts/UserAwareDispatchable';
import { HeartbeatCallback, JobInfo } from 'api/core/libs/queue/application/contracts/Dispatchable';
import { V1WebSocketsWrapper } from 'api/core/infrastructure/services/V1WebSocketsWrapper';
import {
  CsvCreateRelationshipEntitiesJob,
  RelationshipsProgress,
} from '../../application/jobs/CsvCreateRelationshipEntitiesJob';

type Params = UserAwareDispatchableParams & {
  importId: string;
};

type Deps = {
  useCase: CsvCreateRelationshipEntitiesJob;
  sockets: V1WebSocketsWrapper;
};

export class CsvCreateRelationshipEntitiesJobHandler extends UserAwareDispatchable<Params> {
  constructor(private deps: Deps) {
    super();
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
