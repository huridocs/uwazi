/* eslint-disable max-statements */
import { AbstractUseCase, BaseDeps } from 'api/common.v2/contracts/UseCase';
import { DispatchableClass } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { applicationEventsBus } from 'api/eventsbus';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { RelationshipTypesDataSource } from 'api/relationshiptypes.v2/contracts/RelationshipTypesDataSource';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { Template } from 'api/templates.v2/model/Template';
import { V1RelationshipProperty } from 'api/templates.v2/model/V1RelationshipProperty';
import { TemplateUpdatedEvent } from 'api/templates/events/TemplateUpdatedEvent';
import { tenants } from 'api/tenants';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { CommonPropertyFactory } from '../domain/template/CommonPropertyFactory';
import { GenerateIdProperty } from '../domain/template/GenerateIdProperty';
import { PropertyCreatorServiceStrategy } from '../domain/template/propertyCreatorService/PropertyCreatorServiceStrategy';
import { ThesauriDataSource } from '../domain/template/propertyCreatorService/SelectPropertyCreatorService';
import { TranslationService } from '../domain/template/TranslationService';
import { TemplatePostProcessEntitiesJob } from '../infrastructure/jobs/TemplatePostProcessEntitiesJob';
import { TemplateMapper } from '../infrastructure/mongodb/template/Mapper';
import { UpdateTemplateDTO } from './TemplateDTOs';
import { Dispatchable } from '../libs/queue/application/contracts/Dispatchable';

type Output = Template;

type Deps = {
  templatesDS: TemplatesDataSource;
  thesauriDS: ThesauriDataSource;
  entitiesDS: MultiLanguageEntityDataSource;
  translationService: TranslationService;
  settingsDS: SettingsDataSource;
  relationshipTypesDS: RelationshipTypesDataSource;
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
    language: LanguageISO6391,
    fullReindex = false
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

    await this.jobsDispatcher.dispatchMany(async dispatch => {
      if (
        relationshipPropsWithChangedRelData.length ||
        newRelationshipProps.length ||
        newGeneratedIdProps.length ||
        Object.keys(renamedProperties).length ||
        deletedProperties.length
      ) {
        const userId = permissionsContext.getUserInContext()?._id?.toString();
        if (!userId) {
          throw new Error('This process can not be started without a user');
        }
        await this.dispatchPostProcessJob(
          {
            templateId: updatedTemplate.id,
            language,
            fullReindex: false,
            modifiedRelationshipsProps: relationshipPropsWithChangedRelData
              .concat(newRelationshipProps)
              .map(p => p.id),
            newGeneratedIdProps: newGeneratedIdProps.map(p => p.id),
            deletedProperties,
            renamedProperties,
          },
          dispatch
        );
      }

      if (fullReindex) {
        await (
          await this.deps.templatesDS.getAll().all()
        )
          .filter(t => t.id !== currentTemplate.id)
          .reduce(async (previous, t) => {
            await previous;
            await this.dispatchPostProcessJob(
              {
                templateId: t.id,
                language,
                fullReindex: true,
                newGeneratedIdProps: [],
                deletedProperties: [],
                modifiedRelationshipsProps: [],
                renamedProperties: {},
              },
              dispatch
            );
          }, Promise.resolve());
      }
    });

    return updatedTemplate;
  }

  private async dispatchPostProcessJob(
    {
      templateId,
      language,
      fullReindex,
      newGeneratedIdProps,
      deletedProperties,
      modifiedRelationshipsProps,
      renamedProperties,
    }: {
      templateId: string;
      language: LanguageISO6391;
      fullReindex: boolean;
      newGeneratedIdProps: string[];
      deletedProperties: string[];
      modifiedRelationshipsProps: string[];
      renamedProperties: { [k: string]: string };
    },
    dispatch: <T extends Dispatchable>(
      dispatchable: DispatchableClass<T>,
      params: Parameters<T['handleDispatch']>[1]
    ) => void
  ) {
    const limit = 50;
    const resultSet = await this.deps.entitiesDS.getSharedIdsByTemplateId(templateId);
    const totalJobs = Math.ceil((await this.deps.entitiesDS.countByTemplateId(templateId)) / limit);
    if (totalJobs > 0) {
      await this.deps.templatesDS.addJobsToProcessingCount(templateId, totalJobs);
    }

    const userId = permissionsContext.getUserInContext()?._id?.toString();
    if (!userId) {
      throw new Error('This process can not be started without a user');
    }
    // eslint-disable-next-line no-await-in-loop
    while (await resultSet.hasNext()) {
      // eslint-disable-next-line no-await-in-loop
      dispatch(TemplatePostProcessEntitiesJob, {
        // eslint-disable-next-line no-await-in-loop
        entitiesIds: await resultSet.nextBatch(limit),
        templateId,
        language,
        modifiedRelationshipsProps,
        newGeneratedIdProps,
        deletedProperties,
        renamedProperties,
        fullReindex,
        tenantName: tenants.current().name,
        userId,
      });
    }
  }
}

export { UpdateTemplateUseCase };
