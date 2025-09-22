import { IdGenerator } from '../../common.v2/contracts/IdGenerator.js';
import { AbstractUseCase } from '../../common.v2/contracts/UseCase.js';
import { ValidationError } from '../../common.v2/validation/ValidationError.js';
import { MultiLanguageEntityDataSource } from '../../entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { applicationEventsBus } from '../../eventsbus/index.js';
import { permissionsContext } from '../../permissions/permissionsContext.js';
import { JobsDispatcher } from '../../queue.v2/application/contracts/JobsDispatcher.js';
import { RelationshipTypesDataSource } from '../../relationshiptypes.v2/contracts/RelationshipTypesDataSource.js';
import { SettingsDataSource } from '../../settings.v2/contracts/SettingsDataSource.js';
import { TemplatesDataSource } from '../../templates.v2/contracts/TemplatesDataSource.js';
import { Template } from '../../templates.v2/model/Template.js';
import { V1RelationshipProperty } from '../../templates.v2/model/V1RelationshipProperty.js';
import { TemplateUpdatedEvent } from '../../templates/events/TemplateUpdatedEvent.js';
import { tenants } from '../../tenants/index.js';
import { LanguageISO6391 } from '../../shared/types/commonTypes.js';
import { CommonPropertyFactory } from '../domain/template/CommonPropertyFactory.js';
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
};

class UpdateTemplateUseCase extends AbstractUseCase<UpdateTemplateDTO, Output> {
  private propertyCreatorServiceStrategy: PropertyCreatorServiceStrategy;

  constructor(private deps: Deps) {
    super();

    this.propertyCreatorServiceStrategy = new PropertyCreatorServiceStrategy({
      default: new PropertyCreatorService({ templatesDS: this.deps.templatesDS }),
      relationship: new RelationshipPropertyCreatorService({
        templatesDS: this.deps.templatesDS,
        relationshipTypesDS: this.deps.relationshipTypesDS,
      }),
      select: new SelectPropertyCreatorService({
        templatesDS: this.deps.templatesDS,
        thesauriDS: this.deps.thesauriDS,
      }),
    });
  }

  protected async executeAsync(
    input: UpdateTemplateDTO,
    language: LanguageISO6391
  ): Promise<Output> {
    const currentTemplate = await this.deps.templatesDS.getById(input._id);
    if (!currentTemplate) {
      throw new Error(`Trying to update an unexistant Template: ${input._id}`);
    }
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

    await this.deps.templatesDS.update(updatedTemplate);
    await this.deps.translationService.updateTemplateTranslation(currentTemplate, updatedTemplate);

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

    const newRelationshipProps = currentTemplate
      .selectNewProperties(updatedTemplate)
      .filter((p): p is V1RelationshipProperty => p.type === 'relationship');
    if (
      !relationshipPropsWithChangedRelData.length ||
      newRelationshipProps.length ||
      renamedProperties ||
      deletedProperties
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
          deletedProperties,
          renamedProperties,
          tenantName: tenants.current().name,
          userId,
        });
      }
    }
    return updatedTemplate;
  }
}

export { UpdateTemplateUseCase };
