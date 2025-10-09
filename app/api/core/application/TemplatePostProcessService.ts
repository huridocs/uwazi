import { ArrayUtils } from 'api/common.v2/utils/Array';
import { TemplateDiff } from 'api/core/domain/template/TemplateDiff';
import { TemplatePostProcessEntitiesJob } from 'api/core/infrastructure/jobs/TemplatePostProcessEntitiesJob';
import { Dispatchable } from 'api/core/libs/queue/application/contracts/Dispatchable';
import {
  DispatchableClass,
  JobsDispatcher,
} from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { Template } from 'api/templates.v2/model/Template';
import { TemplateUpdatedEventContext } from 'api/templates/events/TemplateUpdatedEvent';
import { LanguageISO6391 } from 'shared/types/commonTypes';

type Deps = {
  jobsDispatcher: JobsDispatcher;
  templatesDS: TemplatesDataSource;
  entitiesDS: MultiLanguageEntityDataSource;
};

type Input = {
  oldTemplate: Template;
  newTemplate: Template;
  context: TemplateUpdatedEventContext;
};

class TemplatePostProcessService {
  constructor(private deps: Deps) {}

  async handle({ oldTemplate, newTemplate, context }: Input) {
    const templateDiff = new TemplateDiff(oldTemplate, newTemplate);

    await this.deps.jobsDispatcher.dispatchMany(async dispatch => {
      if (templateDiff.hasAnyPostProcessChanges()) {
        await this.dispatchPostProcessJob(
          {
            tenantName: context!.tenantName,
            userId: context!.userId,
            language: context!.language,
            templateId: newTemplate.id,
            fullReindex: false,
            modifiedRelationshipsProps: templateDiff.modifiedRelationshipPropIds,
            newGeneratedIdProps: templateDiff.newGeneratedIdPropIds,
            deletedProperties: templateDiff.deletedPropertyNames,
            renamedProperties: templateDiff.renamedProperties,
          },
          dispatch
        );
      }

      if (context?.fullReindex) {
        const templates = (await this.deps.templatesDS.getAll().all()).filter(
          t => t.id !== newTemplate.id
        );

        await ArrayUtils.sequentialFor(templates, async template =>
          this.dispatchPostProcessJob(
            {
              templateId: template.id,
              language: context.language,
              fullReindex: true,
              newGeneratedIdProps: [],
              deletedProperties: [],
              modifiedRelationshipsProps: [],
              renamedProperties: {},
              userId: context.userId,
              tenantName: context.tenantName,
            },
            dispatch
          )
        );
      }
    });
  }

  private async dispatchPostProcessJob(
    {
      templateId,
      language,
      fullReindex,
      newGeneratedIdProps,
      deletedProperties,
      modifiedRelationshipsProps,
      renamedProperties,
      userId,
      tenantName,
    }: {
      tenantName: string;
      userId: string;
      templateId: string;
      language: LanguageISO6391;
      fullReindex: boolean;
      newGeneratedIdProps: string[];
      deletedProperties: string[];
      modifiedRelationshipsProps: string[];
      renamedProperties: { [k: string]: string };
    },
    dispatch: <T extends Dispatchable>(
      dispatchable: DispatchableClass<T>,
      params: Parameters<T['handleDispatch']>[1]
    ) => void
  ) {
    const limit = 50;
    const resultSet = await this.deps.entitiesDS.getSharedIdsByTemplateId(templateId);
    const totalJobs = Math.ceil((await this.deps.entitiesDS.countByTemplateId(templateId)) / limit);
    if (totalJobs > 0) {
      await this.deps.templatesDS.addJobsToProcessingCount(templateId, totalJobs);
    }

    // eslint-disable-next-line no-await-in-loop
    while (await resultSet.hasNext()) {
      // eslint-disable-next-line no-await-in-loop
      dispatch(TemplatePostProcessEntitiesJob, {
        // eslint-disable-next-line no-await-in-loop
        entitiesIds: await resultSet.nextBatch(limit),
        templateId,
        language,
        modifiedRelationshipsProps,
        newGeneratedIdProps,
        deletedProperties,
        renamedProperties,
        fullReindex,
        tenantName,
        userId,
      });
    }
  }
}

export { TemplatePostProcessService };
export type { Deps as TemplatePostProcessServiceDeps };
