import { TemplatesDataSource } from 'api/core/application/contracts/TemplatesDataSource';
import { PDFPostProcess } from 'api/core/application/PDFPostProcess';
import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from 'api/core/libs/queue/application/contracts/UserAwareDispatchable';

type Params = UserAwareDispatchableParams & {
  documentId: string;
};

type JobDependencies = {
  useCase: PDFPostProcess;
  templatesDS: TemplatesDataSource;
};

class PDFPostProcessJob extends UserAwareDispatchable<Params> {
  public constructor(private deps: JobDependencies) {
    super();
  }

  async handle() {
    await this.deps.useCase.execute(this.params);
  }
}

export { PDFPostProcessJob };
