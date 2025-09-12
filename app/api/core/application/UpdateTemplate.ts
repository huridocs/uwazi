import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import { AbstractUseCase } from 'api/common.v2/contracts/UseCase';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { applicationEventsBus } from 'api/eventsbus';
import { JobsDispatcher } from 'api/queue.v2/application/contracts/JobsDispatcher';
import { RelationshipTypesDataSource } from 'api/relationshiptypes.v2/contracts/RelationshipTypesDataSource';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { Template } from 'api/templates.v2/model/Template';
import { TemplateUpdatedEvent } from 'api/templates/events/TemplateUpdatedEvent';
import { CommonPropertyFactory } from '../domain/template/CommonPropertyFactory';
import { PropertyCreatorService } from '../domain/template/propertyCreatorService/PropertyCreatorService';
import { PropertyCreatorServiceStrategy } from '../domain/template/propertyCreatorService/PropertyCreatorServiceStrategy';
import { RelationshipPropertyCreatorService } from '../domain/template/propertyCreatorService/RelationshipPropertyCreatorService';
import {
  SelectPropertyCreatorService,
  ThesauriDataSource,
} from '../domain/template/propertyCreatorService/SelectPropertyCreatorService';
import { TranslationService } from '../domain/template/TranslationService';
import { TemplateMapper } from '../infrastructure/mongodb/template/Mapper';
import { UpdateTemplateDTO } from './TemplateDTOs';

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

  protected async executeAsync(input: UpdateTemplateDTO): Promise<Output> {
    const currentTemplate = await this.deps.templatesDS.getById(input._id);
    if (!currentTemplate) {
      throw new Error(`Trying to update an unexistant Template: ${input._id}`);
    }
    const { newNameGeneration } = await this.deps.settingsDS.get();

    const commonProperties = input.commonProperties.map(p =>
      CommonPropertyFactory.create(
        { ...p, id: p._id || this.deps.idGenerator.generate(), template: 'id' },
        { newNameGeneration }
      )
    );

    const properties = await Promise.all(
      input?.properties?.map(async p =>
        this.propertyCreatorServiceStrategy
          .getStrategy(p.type)
          .create(
            { ...p, id: p._id || this.deps.idGenerator.generate(), template: 'id' },
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

    await applicationEventsBus.emit(
      new TemplateUpdatedEvent({
        before: TemplateMapper.toSchema(currentTemplate),
        after: TemplateMapper.toSchema(updatedTemplate),
      })
    );

    // const relationshipPropsWithChangedRelData =
    //   currentTemplate.selectRelationshipPropsWithRelationshipChanges(updatedTemplate);
    // const deletedProperties = currentTemplate
    //   .selectDeletedProperties(updatedTemplate)
    //   .map(property => property.name);
    // const renamedProperties = Object.fromEntries(
    //   currentTemplate
    //     .selectPropertiesWhereNameHasChanged(updatedTemplate)
    //     .map(({ oldProperty, newProperty }) => [oldProperty.name, newProperty.name])
    // );
    //
    // const newRelationshipProps = currentTemplate
    //   .selectNewProperties(updatedTemplate)
    //   .filter((p): p is V1RelationshipProperty => p.type === 'relationship');
    // if (
    //   !relationshipPropsWithChangedRelData.length ||
    //   newRelationshipProps.length ||
    //   renamedProperties ||
    //   deletedProperties
    // ) {
    //   const limit = 50;
    //   const resultSet = await this.deps.entitiesDS.getSharedIdsByTemplateId(updatedTemplate.id);
    //   const totalJobs = Math.ceil(
    //     (await this.deps.entitiesDS.countByTemplateId(updatedTemplate.id)) / limit
    //   );
    //   await this.deps.templatesDS.setProcessingTotalJobs(updatedTemplate.id, totalJobs);
    //
    //   // eslint-disable-next-line no-await-in-loop
    //   while (await resultSet.hasNext()) {
    //     // eslint-disable-next-line no-await-in-loop
    //     await this.deps.jobsDispatcher.dispatch(DenormalizeV1RelationshipsJob, {
    //       // eslint-disable-next-line no-await-in-loop
    //       entitiesIds: await resultSet.nextBatch(limit),
    //       templateId: updatedTemplate.id,
    //       language,
    //       modifiedRelationshipsProps: modifiedRelationshipsProps.map(prop => prop.id),
    //       deletedProperties,
    //       renamedProperties,
    //       tenantName: tenants.current().name,
    //       userId,
    //     });
    //   }
    // }
    return updatedTemplate;
  }
}

export { UpdateTemplateUseCase };
