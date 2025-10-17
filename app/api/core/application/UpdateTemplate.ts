import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { RelationshipTypesDataSource } from 'api/relationshiptypes.v2/contracts/RelationshipTypesDataSource';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource'; // Todo
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { CommonPropertyFactory } from '../domain/template/CommonPropertyFactory';
import { InheritedPropertyCanNotBeDeleted } from '../domain/template/errors';
import { TemplateUpdatedEvent } from '../domain/template/events/TemplateUpdatedEvent';
import { TemplateDiff } from '../domain/template/TemplateDiff';
import { TemplatesDataSource } from '../domain/template/TemplatesDataSource';
import { TranslationService } from '../domain/template/TranslationService';
import { AbstractUseCase } from '../libs/UseCase';
import { PropertyCreatorServiceStrategy } from './propertyCreatorService/PropertyCreatorServiceStrategy';
import { ThesauriDataSource } from './propertyCreatorService/SelectPropertyCreatorService';
import { UpdateTemplateDTO } from './TemplateDTOs';
import { TemplatePostProcessService } from './TemplatePostProcessService';
import { Template } from '../domain/template/Template';
import { MongoTemplateMapper } from '../infrastructure/mongodb/template/Mapper';

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

class UpdateTemplateUseCase extends AbstractUseCase<UpdateTemplateDTO, Output, Deps> {
  protected async executeAsync(
    input: UpdateTemplateDTO,
    { language, fullReindex }: Context
  ): Promise<Output> {
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
