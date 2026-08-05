import { RelationshipTypesDataSource } from '#api/core/application/contracts/RelationshipTypesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { CommonPropertyFactory } from '../domain/template/CommonPropertyFactory.js';
import { TemplateWithDuplicatedNameOnTheSystemError } from '../domain/template/errors.js';
import { PageService } from '../domain/template/PageService.js';
import { TemplatesDataSource } from './contracts/TemplatesDataSource.js';
import { TranslationService } from '../domain/template/TranslationService.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { PropertyCreatorServiceStrategy } from './propertyCreatorService/PropertyCreatorServiceStrategy.js';
import { ThesauriDataSource } from './propertyCreatorService/SelectPropertyCreatorService.js';
import { CreateTemplateDTO } from './TemplateDTOs.js';
import { Template } from '../domain/template/Template.js';

type Input = CreateTemplateDTO;

type Output = Template;

type Deps = {
  templatesDS: TemplatesDataSource;
  thesauriDS: ThesauriDataSource;
  translationService: TranslationService;
  settingsDS: SettingsDataSource;
  relationshipTypesDS: RelationshipTypesDataSource;
  pageService: PageService;
};

class CreateTemplateUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const propertyCreatorServiceStrategy = PropertyCreatorServiceStrategy.create({
      ...this.deps,
      idGenerator: this.idGenerator,
    });

    const { newNameGeneration } = await this.deps.settingsDS.get();
    const templateId = this.idGenerator.generate();

    const commonProperties = input.commonProperties.map(p =>
      CommonPropertyFactory.create(
        { ...p, id: this.idGenerator.generate(), template: templateId },
        { newNameGeneration }
      )
    );

    const properties = await propertyCreatorServiceStrategy.bulkCreate(input.properties, {
      newNameGeneration,
      template: templateId,
    });

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

    await this.transactionManager.run(async () => {
      await this.deps.templatesDS.create(template);
      await this.deps.translationService.createTemplateTranslation(template);
    });

    return template;
  }
}

export { CreateTemplateUseCase };
export type { Input as CreateTemplateUseCaseInput };
