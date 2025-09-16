import { AbstractUseCase } from 'api/common.v2/contracts/UseCase';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { Template } from 'api/templates.v2/model/Template';
import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { RelationshipTypesDataSource } from 'api/relationshiptypes.v2/contracts/RelationshipTypesDataSource';
import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { CommonPropertyFactory } from '../domain/template/CommonPropertyFactory';
import { PropertyCreatorServiceStrategy } from '../domain/template/propertyCreatorService/PropertyCreatorServiceStrategy';
import { ThesauriDataSource } from '../domain/template/propertyCreatorService/SelectPropertyCreatorService';
import { TemplateWithDuplicatedNameOnTheSystemError } from '../domain/template/errors';
import { TranslationService } from '../domain/template/TranslationService';
import { CreateTemplateDTO } from './TemplateDTOs';
import { PageService } from '../domain/template/PageService';

type Output = Template;

type Deps = {
  templatesDS: TemplatesDataSource;
  thesauriDS: ThesauriDataSource;
  translationService: TranslationService;
  settingsDS: SettingsDataSource;
  relationshipTypesDS: RelationshipTypesDataSource;
  idGenerator: IdGenerator;
  transactionManager: TransactionManager;
  pageService: PageService;
};

class CreateTemplateUseCase extends AbstractUseCase<CreateTemplateDTO, Output> {
  private propertyCreatorServiceStrategy: PropertyCreatorServiceStrategy;

  constructor(private deps: Deps) {
    super();

    this.propertyCreatorServiceStrategy = PropertyCreatorServiceStrategy.create(this.deps);
  }

  // eslint-disable-next-line max-statements
  protected async executeAsync(input: CreateTemplateDTO): Promise<Output> {
    const { newNameGeneration } = await this.deps.settingsDS.get();
    const templateId = this.deps.idGenerator.generate();

    const commonProperties = input.commonProperties.map(p =>
      CommonPropertyFactory.create(
        { ...p, id: this.deps.idGenerator.generate(), template: 'id' },
        { newNameGeneration }
      )
    );

    const properties = await Promise.all(
      input?.properties?.map(async p =>
        this.propertyCreatorServiceStrategy
          .getStrategy(p.type)
          .create(
            { ...p, id: this.deps.idGenerator.generate(), template: templateId },
            { newNameGeneration }
          )
      ) || []
    );

    const template = new Template(
      templateId,
      input.name,
      properties,
      commonProperties,
      input.color,
      false,
      input.entityViewPage
    );

    const isTemplateUnique = await this.deps.templatesDS.isTemplateUnique(template);
    if (!isTemplateUnique) {
      throw new TemplateWithDuplicatedNameOnTheSystemError(template);
    }

    await this.deps.pageService.ensurePageIsValid(template);

    await this.deps.transactionManager.run(async () => {
      await this.deps.templatesDS.create(template);
      await this.deps.translationService.createTemplateTranslation(template);
    });

    return template;
  }
}

export { CreateTemplateUseCase };
