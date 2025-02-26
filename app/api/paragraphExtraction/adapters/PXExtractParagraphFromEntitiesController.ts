import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from 'api/common.v2/AbstractController';

import {
  Input,
  InputSchema,
  PXExtractParagraphsFromEntities,
} from '../application/PXExtractParagraphFromEntities';
import { PXExtractParagraphsFromEntitiesFactory } from '../infrastructure/PXExtractParagraphsFromEntitiesFactory';

type Request = Omit<Input, 'tenantName'>;

type Dependencies = AbstractControllerDependencies<Request>;

class PXExtractParagraphFromEntitiesController extends AbstractController<Request> {
  private useCase: PXExtractParagraphsFromEntities;

  constructor(dependencies: Dependencies) {
    super(dependencies);
    this.useCase = PXExtractParagraphsFromEntitiesFactory.createDefault();
  }

  async handle(): Promise<void> {
    const dto = InputSchema.parse({ ...this.request.body, tenantName: this.tenantName });

    await this.useCase.execute(dto);

    this.ok();
  }
}

export { PXExtractParagraphFromEntitiesController };
