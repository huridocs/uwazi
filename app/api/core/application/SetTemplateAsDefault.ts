import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { AbstractUseCase } from 'api/common.v2/contracts/UseCase';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { Template } from 'api/templates.v2/model/Template';

type Input = {
  templateId: string;
};

type Output = {
  previous?: Template;
  current: Template;
};

type Deps = {
  templatesDS: TemplatesDataSource;
  transactionManager: TransactionManager;
};

class SetTemplateAsDefaultUseCase extends AbstractUseCase<Input, Output, Deps> {
  protected async executeAsync(input: Input): Promise<Output> {
    return this.deps.transactionManager.run(async () => {
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
