/* eslint-disable max-statements */
import { AbstractUseCase, BaseDeps } from 'api/common.v2/contracts/UseCase';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { RelationshipTypesDataSource } from 'api/relationshiptypes.v2/contracts/RelationshipTypesDataSource';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { Template } from 'api/templates.v2/model/Template';
import { TemplateUpdatedEvent } from 'api/templates/events/TemplateUpdatedEvent';
import { tenants } from 'api/tenants';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { CommonPropertyFactory } from '../domain/template/CommonPropertyFactory';
import { PropertyCreatorServiceStrategy } from '../domain/template/propertyCreatorService/PropertyCreatorServiceStrategy';
import { ThesauriDataSource } from '../domain/template/propertyCreatorService/SelectPropertyCreatorService';
import { TranslationService } from '../domain/template/TranslationService';
import { TemplateMapper } from '../infrastructure/mongodb/template/Mapper';
import { UpdateTemplateDTO } from './TemplateDTOs';

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
  private propertyCreatorServiceStrategy: PropertyCreatorServiceStrategy;

  constructor(deps: BaseDeps<Deps>) {
    super(deps);

    this.propertyCreatorServiceStrategy = PropertyCreatorServiceStrategy.create({
      ...this.deps,
      idGenerator: this.idGenerator,
    });
  }

  protected async executeAsync(
    input: UpdateTemplateDTO,
    { language, fullReindex }: Context
  ): Promise<Output> {
    const currentTemplate = (await this.deps.templatesDS.getById(input.id)).getDataOrThrow();

    const { newNameGeneration } = await this.deps.settingsDS.get();

    const commonProperties = input.commonProperties.map(p =>
      CommonPropertyFactory.create(
        { ...p, id: p.id || this.idGenerator.generate(), template: currentTemplate.id },
        { newNameGeneration }
      )
    );

    const properties = await this.propertyCreatorServiceStrategy.bulkCreate(input.properties, {
      newNameGeneration,
      template: currentTemplate.id,
    });

    const updatedTemplate = currentTemplate.update({ ...input, properties, commonProperties });

    await this.transactionManager.run(async () => {
      await this.deps.templatesDS.update(updatedTemplate);
      await this.deps.translationService.updateTemplateTranslation(
        currentTemplate,
        updatedTemplate
      );
      await this.deps.templatesDS.updateMapping(updatedTemplate, fullReindex);
    });

    await this.eventBus.emit(
      new TemplateUpdatedEvent({
        before: TemplateMapper.toSchema(currentTemplate),
        after: TemplateMapper.toSchema(updatedTemplate),
        context: {
          fullReindex,
          language,
          tenantName: tenants.current().name,
          userId: permissionsContext.getUserInContext()!._id!.toString(),
        },
      })
    );

    return updatedTemplate;
  }
}

export { UpdateTemplateUseCase };
