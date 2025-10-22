import { TemplateUpdateDenormalizeEntitiesBatch } from 'api/core/application/TemplateUpdateDenormalizeEntitiesBatch';
import { PXCreateParagraphsJob } from 'api/paragraphExtraction/infrastructure/PXCreateParagraphsJob';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from 'api/core/libs/queue/application/contracts/UserAwareDispatchable';
import { emitToTenant } from 'api/socketio/setupSockets';
import { TemplatesDataSource } from 'api/core/domain/template/TemplatesDataSource';

type Params = UserAwareDispatchableParams & {
  entitiesIds: string[];
  templateId: string;
  language: string;
  modifiedRelationshipsProps: string[];
  newGeneratedIdProps: string[];
  deletedProperties: string[];
  renamedProperties: { [oldName: string]: string };
  fullReindex: boolean;
};

type JobDependencies = {
  useCase: TemplateUpdateDenormalizeEntitiesBatch;
  templatesDS: TemplatesDataSource;
};

export class TemplatePostProcessEntitiesJob extends UserAwareDispatchable<Params> {
  public constructor(private dependencies: JobDependencies) {
    super();
  }

  async handle() {
    await this.dependencies.useCase.execute({
      entitiesIds: this.params.entitiesIds,
      language: this.params.language,
      modifiedRelationshipsProps: this.params.modifiedRelationshipsProps,
      newGeneratedIdProps: this.params.newGeneratedIdProps,
      deletedProperties: this.params.deletedProperties,
      renamedProperties: this.params.renamedProperties,
      templateId: this.params.templateId,
      fullReindex: this.params.fullReindex,
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

export { PXCreateParagraphsJob };
