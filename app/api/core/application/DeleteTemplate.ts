import { AbstractUseCase } from 'api/common.v2/contracts/UseCase';
import { TranslationsDataSource } from 'api/i18n.v2/contracts/TranslationsDataSource';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { TemplateDeletedEvent } from 'api/templates/events/TemplateDeletedEvent';
import { TemplateUpdatedEvent } from 'api/templates/events/TemplateUpdatedEvent';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { Template } from 'api/templates.v2/model/Template';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { tenants } from 'api/tenants';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { TranslationService } from '../domain/template/TranslationService';
import { TemplateMapper } from '../infrastructure/mongodb/template/Mapper';
import { TemplatePostProcessEntitiesJob } from '../infrastructure/jobs/TemplatePostProcessEntitiesJob';
import { DefaultTemplateDeletionError, TemplateInUseError } from '../domain/template/errors';

type Input = {
  templateId: string;
};

type Output = void;

type Deps = {
  templatesDS: TemplatesDataSource;
  multiLanguageEntityDataSourceDS: MultiLanguageEntityDataSource;
  entitiesDS: EntitiesDataSource;
  translationsDS: TranslationsDataSource;
  translationService: TranslationService;
  settingsDS: SettingsDataSource;
};

class DeleteTemplateUseCase extends AbstractUseCase<Input, Output, Deps> {
  // eslint-disable-next-line max-statements
  protected async executeAsync({ templateId }: Input): Promise<Output> {
    const templateToBeDeleted = (await this.deps.templatesDS.getById(templateId)).getData();
    if (!templateToBeDeleted) {
      return;
    }

    if (templateToBeDeleted.isDefault) {
      throw new DefaultTemplateDeletionError();
    }

    const hasEntities = await this.deps.entitiesDS.anyExistsForTemplate(templateToBeDeleted.id);

    if (hasEntities) {
      throw new TemplateInUseError();
    }

    const templates = await this.deps.templatesDS.findTemplatesReferencing(templateToBeDeleted.id);
    const editedTemplates = templates.map(t => t.onTemplateDeleted(templateToBeDeleted));

    await this.transactionManger.run(async () => {
      if (templates.length) {
        await this.deps.templatesDS.bulkUpdate(editedTemplates);

        await this.deps.translationsDS.bulkDeleteKeysByContext(
          templates.map(template => ({
            contextId: template.id,
            keysToDelete: template
              .selectDeletedProperties(editedTemplates.find(t => t.id === template.id)!)
              .map(p => p.name),
          }))
        );
      }

      await this.deps.translationsDS.deleteByContextId(templateToBeDeleted.id);
      await this.deps.templatesDS.delete(templateToBeDeleted.id);
    });

    await this.eventBus.emit(new TemplateDeletedEvent({ templateId }));

    await ArrayUtils.sequentialFor(templates, async template =>
      this.eventBus.emit(
        new TemplateUpdatedEvent({
          before: TemplateMapper.toSchema(template),
          after: TemplateMapper.toSchema(editedTemplates.find(t => t.id === template.id)!),
        })
      )
    );

    await this.bulkCreateTemplatePostProcessingJobs(templates, editedTemplates);
  }

  private async bulkCreateTemplatePostProcessingJobs(
    templates: Template[],
    editedTemplates: Template[]
  ) {
    const defaultLanguage = await this.deps.settingsDS.getDefaultLanguageKey();

    await ArrayUtils.sequentialFor(templates, async template =>
      this.createTranslationPostProcessingJobs(
        template,
        editedTemplates.find(t => t.id === template.id)!,
        defaultLanguage
      )
    );
  }

  // eslint-disable-next-line max-statements
  private async createTranslationPostProcessingJobs(
    currentTemplate: Template,
    editedTemplate: Template,
    language: LanguageISO6391
  ) {
    const deletedProperties = currentTemplate
      .selectDeletedProperties(editedTemplate)
      .map(p => p.name);

    if (!deletedProperties.length) {
      return;
    }

    const batchSize = 50;
    const totalJobs = Math.ceil(
      (await this.deps.multiLanguageEntityDataSourceDS.countByTemplateId(currentTemplate.id)) /
        batchSize
    );

    const resultSet = await this.deps.multiLanguageEntityDataSourceDS.getSharedIdsByTemplateId(
      currentTemplate.id
    );
    await this.deps.templatesDS.addJobsToProcessingCount(currentTemplate.id, totalJobs);

    const userId = permissionsContext.getUserInContext()?._id?.toString()!;

    // eslint-disable-next-line no-await-in-loop
    while (await resultSet.hasNext()) {
      // eslint-disable-next-line no-await-in-loop
      await this.jobsDispatcher.dispatch(TemplatePostProcessEntitiesJob, {
        // eslint-disable-next-line no-await-in-loop
        entitiesIds: await resultSet.nextBatch(batchSize),
        templateId: currentTemplate.id,
        language,
        modifiedRelationshipsProps: [],
        deletedProperties,
        newGeneratedIdProps: [],
        renamedProperties: {},
        fullReindex: false,
        tenantName: tenants.current().name,
        userId,
      });
    }
  }
}

export { DeleteTemplateUseCase };
