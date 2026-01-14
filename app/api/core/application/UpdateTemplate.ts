import { IdGenerator } from '#api/common.v2/contracts/IdGenerator.js';
import { TransactionManager } from '#api/common.v2/contracts/TransactionManager.js';
import { AbstractUseCase } from '#api/common.v2/contracts/UseCase.js';
import { ValidationError } from '#api/common.v2/validation/ValidationError.js';
import { MultiLanguageEntityDataSource } from '../../entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { applicationEventsBus } from '#api/eventsbus/index.js';
import { permissionsContext } from '../../permissions/permissionsContext.js';
import { JobsDispatcher } from '../../queue.v2/application/contracts/JobsDispatcher.js';
import { RelationshipTypesDataSource } from '#api/relationshiptypes.v2/contracts/RelationshipTypesDataSource.js';
import { SettingsDataSource } from '#api/settings.v2/contracts/SettingsDataSource.js';
import { TemplatesDataSource } from '#api/templates.v2/contracts/TemplatesDataSource.js';
import { Template } from '#api/templates.v2/model/Template.js';
import { V1RelationshipProperty } from '#api/templates.v2/model/V1RelationshipProperty.js';
import { TemplateUpdatedEvent } from '../../templates/events/TemplateUpdatedEvent.js';
import { tenants } from '#api/tenants/index.js';

import { LanguageISO6391, PropertySchema } from '#shared/types/commonTypes.js';
import { CommonPropertyFactory } from '../domain/template/CommonPropertyFactory.js';
import { GenerateIdProperty } from '../domain/template/GenerateIdProperty.js';
import { PropertyCreatorServiceStrategy } from '../domain/template/propertyCreatorService/PropertyCreatorServiceStrategy.js';
import { ThesauriDataSource } from '../domain/template/propertyCreatorService/SelectPropertyCreatorService.js';
import { TranslationService } from '../domain/template/TranslationService.js';
import { TemplatePostProcessEntitiesJob } from '../infrastructure/jobs/TemplatePostProcessEntitiesJob.js';
import { TemplateMapper } from '../infrastructure/mongodb/template/Mapper.js';
import { UpdateTemplateDTO } from './TemplateDTOs.js';

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
