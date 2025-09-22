import { TemplateUpdateDenormalizeEntitiesBatch } from '../../application/TemplateUpdateDenormalizeEntitiesBatch.js';
import { PXCreateParagraphsJob } from '../../../paragraphExtraction/infrastructure/PXCreateParagraphsJob.js';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '../../../queue.v2/application/contracts/UserAwareDispatchable.js';
import { emitToTenant } from '../../../socketio/setupSockets.js';
import { TemplatesDataSource } from '../../../templates.v2/contracts/TemplatesDataSource.js';

type Params = UserAwareDispatchableParams & {
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

export class TemplatePostProcessEntitiesJob extends UserAwareDispatchable<Params> {
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

export { PXCreateParagraphsJob };
