import { ArrayUtils } from '#api/common.v2/utils/Array.js'; // Todo
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { TemplateUpdatedEventContext } from '../domain/template/events/TemplateUpdatedEvent.js';
import { TemplateDiff } from '../domain/template/TemplateDiff.js';
import { TemplatesDataSource } from './contracts/TemplatesDataSource.js';
import { Dispatcher, TemplatePostProcessParams } from './contracts/Dispatcher.js';
import { Template } from '../domain/template/Template.js';

type Deps = {
  dispatcher: Dispatcher;
  templatesDS: TemplatesDataSource;
  entitiesDS: MultiLanguageEntityDataSource;
};

type Input = {
  before: Template;
  after: Template;
  context: TemplateUpdatedEventContext;
};

type CollectPostProcessJobProps = {
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

    await this.deps.dispatcher.postProcessTemplateEntities(async dispatch => {
      if (diff.hasAnyPostProcessChanges()) {
        await this.collectPostProcessJobParams(
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
        let templates = await this.deps.templatesDS.getAll().all();
        if (diff.hasAnyPostProcessChanges()) {
          templates = templates.filter(t => t.id !== after.id);
        }

        await ArrayUtils.sequentialFor(templates, async template =>
          this.collectPostProcessJobParams(
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

  private async collectPostProcessJobParams(
    { diff, language, fullReindex, userId, tenantName }: CollectPostProcessJobProps,
    dispatch: (params: TemplatePostProcessParams) => void
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
      dispatch({
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
