import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from 'api/common.v2/AbstractController';
import { tenants } from 'api/tenants';

import {
  Input,
  InputSchema,
  PXExtractParagraphsFromEntities,
} from '../application/PXExtractParagraphFromEntities';

type Request = Omit<Input, 'tenantName'>;

type Dependencies = {
  extractParagraphFromEntities: PXExtractParagraphsFromEntities;
} & AbstractControllerDependencies<Request>;

class PXExtractParagraphFromEntitiesController extends AbstractController<Request> {
  useCase: PXExtractParagraphsFromEntities;

  constructor(dependencies: Dependencies) {
    super(dependencies);
    this.useCase = dependencies.extractParagraphFromEntities;
  }

  async handle(): Promise<void> {
    const dto = InputSchema.parse({ ...this.request.body, tenantName: tenants.current().name });

    await this.useCase.execute(dto);

    this.ok();
  }
}

export { PXExtractParagraphFromEntitiesController };
