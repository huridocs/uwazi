import { Template } from '../domain/template/Template.js';
import { TemplatesDataSource } from './contracts/TemplatesDataSource.js';
import { AbstractUseCase } from '../libs/UseCase.js';

type Input = {
  templateId: string;
};

type Output = {
  previous?: Template;
  current: Template;
};

type Deps = {
  templatesDS: TemplatesDataSource;
};

class SetTemplateAsDefaultUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    return this.transactionManager.run(async () => {
      const template = (await this.deps.templatesDS.getById(input.templateId)).getDataOrThrow();
      const existingDefault = (await this.deps.templatesDS.getDefaultTemplate()).getData();

      template.setAsDefault(existingDefault);

      await this.deps.templatesDS.update(template);
      if (existingDefault) {
        await this.deps.templatesDS.update(existingDefault);
      }

      return { current: template, previous: existingDefault };
    });
  }
}

export { SetTemplateAsDefaultUseCase };
