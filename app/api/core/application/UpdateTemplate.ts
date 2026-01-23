import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { RelationshipTypesDataSource } from '#api/relationshiptypes.v2/contracts/RelationshipTypesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { Template } from '#api/core/domain/template/Template.js';
import { TemplateUpdatedEvent } from '#api/core/domain/template/events/TemplateUpdatedEvent.js';

import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { CommonPropertyFactory } from '#api/core/domain/template/CommonPropertyFactory.js';
import { PropertyCreatorServiceStrategy } from '../application/propertyCreatorService/PropertyCreatorServiceStrategy.js';
import { ThesauriDataSource } from '../application/propertyCreatorService/SelectPropertyCreatorService.js';
import { TranslationService } from '#api/core/domain/template/TranslationService.js';
import { MongoTemplateMapper } from '#api/core/infrastructure/mongodb/template/MongoTemplateMapper.js';
import { UpdateTemplateDTO } from '#api/core/application/TemplateDTOs.js';
import { TemplatePostProcessService } from '#api/core/application/TemplatePostProcessService.js';
import { TemplateDiff } from '#api/core/domain/template/TemplateDiff.js';
import { InheritedPropertyCanNotBeDeleted } from '#api/core/domain/template/errors.js';

type Input = UpdateTemplateDTO;
type Output = Template;

type Deps = {
  templatesDS: TemplatesDataSource;
  thesauriDS: ThesauriDataSource;
  entitiesDS: MultiLanguageEntityDataSource;
  translationService: TranslationService;
  settingsDS: SettingsDataSource;
  relationshipTypesDS: RelationshipTypesDataSource;
};

type Context = {
  language: LanguageISO6391;
  fullReindex: boolean;
};

class UpdateTemplateUseCase extends AbstractUseCase<Input, Output, Deps, [Context]> {
  async execute(input: Input, { language, fullReindex }: Context): Promise<Output> {
    const propertyCreatorServiceStrategy = PropertyCreatorServiceStrategy.create({
      ...this.deps,
      idGenerator: this.idGenerator,
    });

    const service = new TemplatePostProcessService({
      ...this.deps,
      jobsDispatcher: this.jobsDispatcher,
    });

    const currentTemplate = (await this.deps.templatesDS.getById(input.id)).getDataOrThrow();

    const { newNameGeneration } = await this.deps.settingsDS.get();

    const commonProperties = input.commonProperties.map(p =>
      CommonPropertyFactory.create(
        { ...p, id: p.id || this.idGenerator.generate(), template: currentTemplate.id },
        { newNameGeneration }
      )
    );

    const properties = await propertyCreatorServiceStrategy.bulkCreate(input.properties, {
      newNameGeneration,
      template: currentTemplate.id,
    });

    const updatedTemplate = currentTemplate.update({ ...input, properties, commonProperties });

    const templateDiff = new TemplateDiff(currentTemplate, updatedTemplate);
    const propertiesBeingInherited = await this.deps.templatesDS.getPropertiesBeingInherited(
      templateDiff.deletedProperties
    );

    if (propertiesBeingInherited.length) {
      throw new InheritedPropertyCanNotBeDeleted(propertiesBeingInherited);
    }

    await this.transactionManager.run(async () => {
      await this.deps.templatesDS.update(updatedTemplate);
      await this.deps.translationService.updateTemplateTranslation(
        currentTemplate,
        updatedTemplate
      );
      await this.deps.templatesDS.updateMapping(updatedTemplate, fullReindex);
    });

    const context = {
      fullReindex,
      language,
      tenantName: this.tenant.name,
      userId: this.actorId,
    };

    await this.eventBus.emit(
      new TemplateUpdatedEvent({
        before: MongoTemplateMapper.toSchema(currentTemplate),
        after: MongoTemplateMapper.toSchema(updatedTemplate),
        context,
      })
    );

    await service.createJobsForEntities({
      after: updatedTemplate,
      before: currentTemplate,
      context,
    });

    return updatedTemplate;
  }
}

export { UpdateTemplateUseCase };
export type { Context as UpdateTemplateUseCaseContext, Input as UpdateTemplateUseCaseInput };
