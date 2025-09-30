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

import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { CommonPropertyFactory } from '../domain/template/CommonPropertyFactory.js';
import { GenerateIdProperty } from '../domain/template/GenerateIdProperty.js';
import { PropertyCreatorService } from '../domain/template/propertyCreatorService/PropertyCreatorService.js';
import { PropertyCreatorServiceStrategy } from '../domain/template/propertyCreatorService/PropertyCreatorServiceStrategy.js';
import { RelationshipPropertyCreatorService } from '../domain/template/propertyCreatorService/RelationshipPropertyCreatorService.js';
import {
  SelectPropertyCreatorService,
  ThesauriDataSource,
} from '../domain/template/propertyCreatorService/SelectPropertyCreatorService.js';
import { TranslationService } from '../domain/template/TranslationService.js';
import { TemplatePostProcessEntitiesJob } from '../infrastructure/jobs/TemplatePostProcessEntitiesJob.js';
import { TemplateMapper } from '../infrastructure/mongodb/template/Mapper.js';
import { UpdateTemplateDTO } from './TemplateDTOs.js';

type Output = Template;

type Deps = {
  templatesDS: TemplatesDataSource;
  idGenerator: IdGenerator;
  thesauriDS: ThesauriDataSource;
  entitiesDS: MultiLanguageEntityDataSource;
  translationService: TranslationService;
  settingsDS: SettingsDataSource;
  relationshipTypesDS: RelationshipTypesDataSource;
  jobsDispatcher: JobsDispatcher;
  transactionManager: TransactionManager;
};

class UpdateTemplateUseCase extends AbstractUseCase<UpdateTemplateDTO, Output, Deps> {
  private propertyCreatorServiceStrategy: PropertyCreatorServiceStrategy;

  constructor(deps: Deps) {
    super(deps);

    this.propertyCreatorServiceStrategy = PropertyCreatorServiceStrategy.create(this.deps);
  }

  protected async executeAsync(
    input: UpdateTemplateDTO,
    language: LanguageISO6391,
    fullReindex = false
  ): Promise<Output> {
    const currentTemplate = (await this.deps.templatesDS.getById(input._id)).getDataOrThrow();
    if (currentTemplate.processing?.active) {
      throw new ValidationError([
        { path: 'processing', message: 'template is being processed you can not update it yet' },
      ]);
    }
    const { newNameGeneration } = await this.deps.settingsDS.get();

    const commonProperties = input.commonProperties.map(p =>
      CommonPropertyFactory.create(
        { ...p, id: p._id || this.deps.idGenerator.generate(), template: currentTemplate.id },
        { newNameGeneration }
      )
    );

    const properties = await Promise.all(
      input?.properties?.map(async p =>
        this.propertyCreatorServiceStrategy
          .getStrategy(p.type)
          .create(
            { ...p, id: p._id || this.deps.idGenerator.generate(), template: currentTemplate.id },
            { newNameGeneration }
          )
      ) || []
    );

    const updatedTemplate = new Template(
      input._id,
      input.name,
      properties,
      commonProperties,
      input.color,
      input.default
    );

    const swappedNameProp = currentTemplate.selectSwappedNameProperties(updatedTemplate);
    if (swappedNameProp) {
      throw new Error(`Properties can't swap names: ${swappedNameProp.name}`);
    }
    await this.deps.transactionManager.run(async () => {
      await this.deps.templatesDS.update(updatedTemplate);
      await this.deps.translationService.updateTemplateTranslation(
        currentTemplate,
        updatedTemplate
      );
      await this.deps.templatesDS.updateMapping(updatedTemplate, fullReindex);
    });

    await applicationEventsBus.emit(
      new TemplateUpdatedEvent({
        before: TemplateMapper.toSchema(currentTemplate),
        after: TemplateMapper.toSchema(updatedTemplate),
      })
    );

    const relationshipPropsWithChangedRelData =
      currentTemplate.selectRelationshipPropsWithRelationshipChanges(updatedTemplate);
    const deletedProperties = currentTemplate
      .selectDeletedProperties(updatedTemplate)
      .map(property => property.name);
    const renamedProperties = Object.fromEntries(
      currentTemplate
        .selectPropertiesWhereNameHasChanged(updatedTemplate)
        .map(({ oldProperty, newProperty }) => [oldProperty.name, newProperty.name])
    );

    const newProperties = currentTemplate.selectNewProperties(updatedTemplate);

    const newRelationshipProps = newProperties.filter(
      (p): p is V1RelationshipProperty => p.type === 'relationship'
    );
    const newGeneratedIdProps = newProperties.filter(
      (p): p is GenerateIdProperty => p.type === 'generatedid'
    );

    if (
      relationshipPropsWithChangedRelData.length ||
      newRelationshipProps.length ||
      newGeneratedIdProps.length ||
      Object.keys(renamedProperties).length ||
      deletedProperties.length
    ) {
      const limit = 50;
      const resultSet = await this.deps.entitiesDS.getSharedIdsByTemplateId(updatedTemplate.id);
      const totalJobs = Math.ceil(
        (await this.deps.entitiesDS.countByTemplateId(updatedTemplate.id)) / limit
      );
      if (totalJobs > 0) {
        await this.deps.templatesDS.setProcessingTotalJobs(updatedTemplate.id, totalJobs);
      }

      const userId = permissionsContext.getUserInContext()?._id?.toString();
      if (!userId) {
        throw new Error('This process can not be started without a user');
      }
      // eslint-disable-next-line no-await-in-loop
      while (await resultSet.hasNext()) {
        // eslint-disable-next-line no-await-in-loop
        await this.deps.jobsDispatcher.dispatch(TemplatePostProcessEntitiesJob, {
          // eslint-disable-next-line no-await-in-loop
          entitiesIds: await resultSet.nextBatch(limit),
          templateId: updatedTemplate.id,
          language,
          modifiedRelationshipsProps: relationshipPropsWithChangedRelData
            .concat(newRelationshipProps)
            .map(p => p.id),
          newGeneratedIdProps: newGeneratedIdProps.map(p => p.id),
          deletedProperties,
          renamedProperties,
          fullReindex: false,
          tenantName: tenants.current().name,
          userId,
        });
      }
    }

    if (fullReindex) {
      await (
        await this.deps.templatesDS.getAll().all()
      )
        .filter(t => t.id !== currentTemplate.id)
        .reduce(async (previous, t) => {
          await previous;
          await this.dispatchPostProcessJob(t.id, language);
        }, Promise.resolve());
    }

    return updatedTemplate;
  }

  private async dispatchPostProcessJob(templateId: string, language: LanguageISO6391) {
    const limit = 50;
    const resultSet = await this.deps.entitiesDS.getSharedIdsByTemplateId(templateId);
    const totalJobs = Math.ceil((await this.deps.entitiesDS.countByTemplateId(templateId)) / limit);
    if (totalJobs > 0) {
      await this.deps.templatesDS.setProcessingTotalJobs(templateId, totalJobs);
    }

    const userId = permissionsContext.getUserInContext()?._id?.toString();
    if (!userId) {
      throw new Error('This process can not be started without a user');
    }
    // eslint-disable-next-line no-await-in-loop
    while (await resultSet.hasNext()) {
      // eslint-disable-next-line no-await-in-loop
      await this.deps.jobsDispatcher.dispatch(TemplatePostProcessEntitiesJob, {
        // eslint-disable-next-line no-await-in-loop
        entitiesIds: await resultSet.nextBatch(limit),
        templateId,
        language,
        modifiedRelationshipsProps: [],
        newGeneratedIdProps: [],
        deletedProperties: [],
        renamedProperties: {},
        fullReindex: true,
        tenantName: tenants.current().name,
        userId,
      });
    }
  }
}

export { UpdateTemplateUseCase };
