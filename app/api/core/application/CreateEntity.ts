import { Entity, EntityIcon } from 'api/core/domain/entity/Entity';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { TranslationsDataSource } from 'api/i18n.v2/contracts/TranslationsDataSource';
import { AbstractUseCase } from '../libs/UseCase';
import { TemplatesDataSource } from '../domain/template/TemplatesDataSource';
import { SettingsDataSource } from './contracts/SettingsDataSource';
import { PropertyAssignmentCreatorServiceStrategy } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy';
import { ThesauriDataSource } from '../infrastructure/mongodb/thesauri/MongoThesauriDS';
import { PropertyAssignmentInput } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorService';

type Input = {
  templateId?: string;
  propertyAssignments: PropertyAssignmentInput[];
  icon?: EntityIcon;
};

type Output = Entity;

type Deps = {
  thesauriDS: ThesauriDataSource;
  translationsDS: TranslationsDataSource;
  settingsDS: SettingsDataSource;
  templatesDS: TemplatesDataSource;
  multiLanguageEntityDS: MultiLanguageEntityDataSource;
};

class CreateEntityUseCase extends AbstractUseCase<Input, Output, Deps> {
  protected async executeAsync(input: Input): Promise<Output> {
    const service = PropertyAssignmentCreatorServiceStrategy.create(this.deps);

    const template = await this.getTemplateByIdOrDefault(input.templateId);
    const languages = await this.deps.settingsDS.getLanguageKeys();

    const entity = Entity.create(
      {
        languages,
        userId: this.actor?.id,
        template,
        icon: input.icon,
      },
      this.idGenerator
    );

    const propertyAssignments = await service.bulkCreate(input.propertyAssignments, template);

    entity.setPropertyAssignments(propertyAssignments);

    await this.transactionManager.run(async () => {
      await this.deps.multiLanguageEntityDS.create(entity);
    });

    return entity;
  }

  private async getTemplateByIdOrDefault(templateId?: string) {
    if (templateId) {
      return (await this.deps.templatesDS.getById(templateId)).getDataOrThrow();
    }

    return (await this.deps.templatesDS.getDefaultTemplate()).getDataOrThrow();
  }
}

export { CreateEntityUseCase };
export type { Input as CreateEntityUseCaseInput };
