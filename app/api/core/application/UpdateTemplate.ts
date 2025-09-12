import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import { AbstractUseCase } from 'api/common.v2/contracts/UseCase';
import { applicationEventsBus } from 'api/eventsbus';
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
  translationService: TranslationService;
  settingsDS: SettingsDataSource;
  relationshipTypesDS: RelationshipTypesDataSource;
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
    const previousTemplate = await this.deps.templatesDS.getById(input._id);
    if (!previousTemplate) {
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
            { ...p, id: this.deps.idGenerator.generate(), template: 'id' },
            { newNameGeneration }
          )
      ) || []
    );

    const newTemplate = new Template(
      input._id,
      input.name,
      properties,
      commonProperties,
      input.color,
      input.default
    );

    await this.deps.templatesDS.update(newTemplate);

    await applicationEventsBus.emit(
      new TemplateUpdatedEvent({
        before: TemplateMapper.toSchema(previousTemplate),
        after: TemplateMapper.toSchema(newTemplate),
      })
    );
    return newTemplate;
  }
}

export { UpdateTemplateUseCase };
