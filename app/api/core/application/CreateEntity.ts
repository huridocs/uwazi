import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { Entity } from 'api/core/domain/entity/Entity';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { AbstractUseCase } from '../libs/UseCase';
import { TemplatesDataSource } from '../domain/template/TemplatesDataSource';

type Input = {
  templateId?: string;
  propertyValues: { name: string; value: any[] }[];
};

type Output = Entity;

type Deps = {
  settingsDS: SettingsDataSource;
  templatesDS: TemplatesDataSource;
  multiLanguageEntityDS: MultiLanguageEntityDataSource;
};

class CreateEntityUseCase extends AbstractUseCase<Input, Output, Deps> {
  protected async executeAsync(input: Input): Promise<Output> {
    const template = await this.getTemplateByIdOrDefault(input.templateId);
    const languages = await this.deps.settingsDS.getLanguageKeys();

    const entity = Entity.create(
      {
        languages,
        userId: this.actor?.id,
        template,
      },
      this.idGenerator
    );

    const propertyValues = input.propertyValues.map(({ name, value }) =>
      template.createPropertyValue(name, value)
    );

    entity.setValues(propertyValues);

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
