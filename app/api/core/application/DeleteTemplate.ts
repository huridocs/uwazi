import { ArrayUtils } from '#api/common.v2/utils/Array.js'; // Todo
import { EntitiesDataSource } from '#api/entities.v2/contracts/EntitiesDataSource.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { TranslationsDataSource } from '#api/i18n.v2/contracts/TranslationsDataSource.js'; // Todo
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js'; // Todo
import { DefaultTemplateDeletionError, TemplateInUseError } from '../domain/template/errors.js';
import { TemplateDeletedEvent } from '../domain/template/events/TemplateDeletedEvent.js';
import { TemplateUpdatedEvent } from '../domain/template/events/TemplateUpdatedEvent.js';
import { TemplatesDataSource } from './contracts/TemplatesDataSource.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { TemplatePostProcessService } from './TemplatePostProcessService.js';
import { MongoTemplateMapper } from '../infrastructure/mongodb/template/MongoTemplateMapper.js';

type Input = {
  templateId: string;
};

type Output = Input;

type Deps = {
  templatesDS: TemplatesDataSource;
  entitiesDS: EntitiesDataSource;
  translationsDS: TranslationsDataSource;
  settingsDS: SettingsDataSource;
  multiLanguageEntitiesDS: MultiLanguageEntityDataSource;
};

class DeleteTemplateUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ templateId }: Input): Promise<Output> {
    const templateToBeDeleted = (await this.deps.templatesDS.getById(templateId)).getData();
    if (!templateToBeDeleted) {
      return { templateId };
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
          before: MongoTemplateMapper.toSchema(before),
          after: MongoTemplateMapper.toSchema(after),
          context,
        })
      );

      await service.createJobsForEntities({ context, before, after });
    });

    return { templateId };
  }
}

export { DeleteTemplateUseCase };
