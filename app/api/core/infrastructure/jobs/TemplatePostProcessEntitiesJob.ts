import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { TemplateUpdateDenormalizeEntitiesBatch } from '#api/core/application/TemplateUpdateDenormalizeEntitiesBatch.js';
import { emitToTenant } from '#api/socketio/setupSockets.js';
import { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';

type Params = UwaziJobParams & {
  tenantName: string;
  entitiesIds: string[];
  templateId: string;
  language: string;
  modifiedRelationshipsProps: string[];
  newGeneratedIdProps: string[];
  deletedProperties: string[];
  renamedProperties: { [oldName: string]: string };
  fullReindex: boolean;
  resaveForFilterChange: boolean;
};

type JobDependencies = {
  useCase: TemplateUpdateDenormalizeEntitiesBatch;
  templatesDS: TemplatesDataSource;
};

@PrivilegedJob()
export class TemplatePostProcessEntitiesJob extends UwaziJobHandler<Params> {
  public constructor(private dependencies: JobDependencies) {
    super();
  }

  async handle(_heartbeat: HeartbeatCallback, params: Params) {
    await this.dependencies.useCase.execute({
      entitiesIds: params.entitiesIds,
      language: params.language,
      modifiedRelationshipsProps: params.modifiedRelationshipsProps,
      newGeneratedIdProps: params.newGeneratedIdProps,
      deletedProperties: params.deletedProperties,
      renamedProperties: params.renamedProperties,
      templateId: params.templateId,
      fullReindex: params.fullReindex,
      resaveForFilterChange: params.resaveForFilterChange,
      onAllEntitiesDenormalized: () =>
        emitToTenant(params.tenantName, 'templateProcessed', { templateId: params.templateId }),
      onProgress: (processing: { active: boolean; totalJobs: number; completedJobs: number }) =>
        emitToTenant(params.tenantName, 'templateProcessing', {
          templateId: params.templateId,
          processing,
        }),
    });
  }
}
