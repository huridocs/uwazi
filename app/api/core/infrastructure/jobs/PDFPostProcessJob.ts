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
