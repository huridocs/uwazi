import {
  UserAwareDispatchableParams,
  UserAwareDispatchable,
} from 'api/queue.v2/application/contracts/UserAwareDispatchable';
import { emitToTenant } from 'api/socketio/setupSockets';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { TemplateUpdateDenormalizeEntitiesBatch } from 'api/templates/templateUpdateDenormalizeUseCase';

type JobParams = UserAwareDispatchableParams & {
  entitiesIds: string[];
  templateId: string;
  language: string;
  modifiedRelationshipsProps: string[];
  deletedProperties: string[];
  renamedProperties: { [oldName: string]: string };
};

type JobDependencies = {
  useCase: TemplateUpdateDenormalizeEntitiesBatch;
  templatesDS: TemplatesDataSource;
};

export class TemplatesPostProcessEntitiesJob extends UserAwareDispatchable<JobParams> {
  public constructor(private dependencies: JobDependencies) {
    super();
  }

  async handle() {
    await this.dependencies.useCase.execute({
      entitiesIds: this.params.entitiesIds,
      language: this.params.language,
      modifiedRelationshipsProps: this.params.modifiedRelationshipsProps,
      deletedProperties: this.params.deletedProperties,
      renamedProperties: this.params.renamedProperties,
      templateId: this.params.templateId,
      onAllEntitiesDenormalized: () =>
        emitToTenant(this.tenantName, 'templateProcessed', { templateId: this.params.templateId }),
      onProgress: (processing: { active: boolean; totalJobs: number; completedJobs: number }) =>
        emitToTenant(this.tenantName, 'templateProcessing', {
          templateId: this.params.templateId,
          processing,
        }),
    });
  }
}
