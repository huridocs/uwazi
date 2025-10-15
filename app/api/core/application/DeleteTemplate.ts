import { AbstractUseCase } from 'api/common.v2/contracts/UseCase';
import { TranslationsDataSource } from 'api/i18n.v2/contracts/TranslationsDataSource';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { TemplateDeletedEvent } from 'api/templates/events/TemplateDeletedEvent';
import { TemplateUpdatedEvent } from 'api/templates/events/TemplateUpdatedEvent';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { TemplateMapper } from '../infrastructure/mongodb/template/Mapper';
import { DefaultTemplateDeletionError, TemplateInUseError } from '../domain/template/errors';
import { TemplatePostProcessService } from './TemplatePostProcessService';

type Input = {
  templateId: string;
};

type Output = void;

type Deps = {
  templatesDS: TemplatesDataSource;
  entitiesDS: EntitiesDataSource;
  translationsDS: TranslationsDataSource;
  settingsDS: SettingsDataSource;
  multiLanguageEntitiesDS: MultiLanguageEntityDataSource;
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

    const service = new TemplatePostProcessService({
      ...this.deps,
      jobsDispatcher: this.jobsDispatcher,
      entitiesDS: this.deps.multiLanguageEntitiesDS,
    });

    const templates = await this.deps.templatesDS.findTemplatesReferencing(templateToBeDeleted.id);
    const editedTemplates = templates.map(t => t.onTemplateDeleted(templateToBeDeleted));

    await this.transactionManager.run(async () => {
      if (templates.length) {
        await this.deps.templatesDS.bulkUpdate(editedTemplates);

        await this.deps.translationsDS.bulkDeleteKeysByContext(
          templates.map(template => ({
            contextId: template.id,
            keysToDelete: template
              .selectDeletedProperties(editedTemplates.find(t => t.id === template.id)!)
              .map(p => p.label),
          }))
        );
      }

      await this.deps.translationsDS.deleteByContextId(templateToBeDeleted.id);
      await this.deps.templatesDS.delete(templateToBeDeleted.id);
    });

    await this.eventBus.emit(new TemplateDeletedEvent({ templateId }));

    const defaultLanguage = await this.deps.settingsDS.getDefaultLanguageKey();

    await ArrayUtils.sequentialFor(templates, async before => {
      const after = editedTemplates.find(t => t.id === before.id)!;
      const context = {
        language: defaultLanguage,
        fullReindex: false,
        tenantName: this.tenant.name,
        userId: this.actorId,
      };

      await this.eventBus.emit(
        new TemplateUpdatedEvent({
          before: TemplateMapper.toSchema(before),
          after: TemplateMapper.toSchema(after),
          context,
        })
      );

      await service.createJobsForEntities({ context, before, after });
    });
  }
}

export { DeleteTemplateUseCase };
