import { AbstractUseCase } from '#api/common.v2/contracts/UseCase.js';
import { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { Template } from '#api/core/domain/template/Template.js';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { RelationshipTypesDataSource } from '#api/relationshiptypes.v2/contracts/RelationshipTypesDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { CommonPropertyFactory } from '../domain/template/CommonPropertyFactory.js';
import { PropertyCreatorServiceStrategy } from '../domain/template/propertyCreatorService/PropertyCreatorServiceStrategy.js';
import { ThesauriDataSource } from '../domain/template/propertyCreatorService/SelectPropertyCreatorService.js';
import { TemplateWithDuplicatedNameOnTheSystemError } from '../domain/template/errors.js';
import { TranslationService } from '../domain/template/TranslationService.js';
import { CreateTemplateDTO } from './TemplateDTOs.js';
import { PageService } from '../domain/template/PageService.js';

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
