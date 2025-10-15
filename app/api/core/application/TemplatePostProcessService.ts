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
  before: Template;
  after: Template;
  context: TemplateUpdatedEventContext;
};

type DispatchPostProcessJobProps = {
  diff: TemplateDiff;
  tenantName: string;
  userId: string;
  language: LanguageISO6391;
  fullReindex: boolean;
};

class TemplatePostProcessService {
  constructor(private deps: Deps) {}

  async createJobsForEntities({ before, after, context }: Input) {
    const diff = new TemplateDiff(before, after);

    await this.deps.jobsDispatcher.dispatchMany(async dispatch => {
      if (diff.hasAnyPostProcessChanges()) {
        await this.dispatchPostProcessJob(
          {
            tenantName: context!.tenantName,
            userId: context!.userId,
            language: context!.language,
            fullReindex: false,
            diff,
          },
          dispatch
        );
      }

      if (context?.fullReindex) {
        const templates = (await this.deps.templatesDS.getAll().all()).filter(
          t => t.id !== after.id
        );

        await ArrayUtils.sequentialFor(templates, async template =>
          this.dispatchPostProcessJob(
            {
              language: context.language,
              fullReindex: true,
              userId: context.userId,
              tenantName: context.tenantName,
              diff: new TemplateDiff(template, template),
            },
            dispatch
          )
        );
      }
    });
  }

  private async dispatchPostProcessJob(
    { diff, language, fullReindex, userId, tenantName }: DispatchPostProcessJobProps,
    dispatch: <T extends Dispatchable>(
      dispatchable: DispatchableClass<T>,
      params: Parameters<T['handleDispatch']>[1]
    ) => void
  ) {
    const limit = 50;
    const resultSet = await this.deps.entitiesDS.getSharedIdsByTemplateId(diff.templateId);
    const totalJobs = Math.ceil(
      (await this.deps.entitiesDS.countByTemplateId(diff.templateId)) / limit
    );
    if (totalJobs > 0) {
      await this.deps.templatesDS.addJobsToProcessingCount(diff.templateId, totalJobs);
    }

    // eslint-disable-next-line no-await-in-loop
    while (await resultSet.hasNext()) {
      // eslint-disable-next-line no-await-in-loop
      dispatch(TemplatePostProcessEntitiesJob, {
        // eslint-disable-next-line no-await-in-loop
        entitiesIds: await resultSet.nextBatch(limit),
        templateId: diff.templateId,
        language,
        modifiedRelationshipsProps: diff.modifiedRelationshipPropIds,
        newGeneratedIdProps: diff.newGeneratedIdPropIds,
        deletedProperties: diff.deletedPropertyNames,
        renamedProperties: diff.renamedProperties,
        fullReindex,
        tenantName,
        userId,
      });
    }
  }
}

export { TemplatePostProcessService };
export type { Deps as TemplatePostProcessServiceDeps };
