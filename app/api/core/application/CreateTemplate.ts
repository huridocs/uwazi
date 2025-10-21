import { RelationshipTypesDataSource } from 'api/relationshiptypes.v2/contracts/RelationshipTypesDataSource';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { CommonPropertyFactory } from '../domain/template/CommonPropertyFactory';
import { TemplateWithDuplicatedNameOnTheSystemError } from '../domain/template/errors';
import { PageService } from '../domain/template/PageService';
import { TemplatesDataSource } from '../domain/template/TemplatesDataSource';
import { TranslationService } from '../domain/template/TranslationService';
import { AbstractUseCase } from '../libs/UseCase';
import { PropertyCreatorServiceStrategy } from './propertyCreatorService/PropertyCreatorServiceStrategy';
import { ThesauriDataSource } from './propertyCreatorService/SelectPropertyCreatorService';
import { CreateTemplateDTO } from './TemplateDTOs';
import { Template } from '../domain/template/Template';

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
  protected async executeAsync(input: Input): Promise<Output> {
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
