import { z } from 'zod';
import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from 'api/common.v2/infrastructure/AbstractController';

import { PXExtractParagraphsFromEntities } from '../application/PXExtractParagraphFromEntities';
import { PXExtractParagraphsFromEntitiesFactory } from '../infrastructure/PXExtractParagraphsFromEntitiesFactory';

type Request = z.infer<typeof RequestSchema>;

type Dependencies = AbstractControllerDependencies<Request>;

const RequestSchema = z.object({
  extractorId: z.string({ message: 'You should provide an Extractor' }),
  entitySharedIds: z.array(z.string({ message: 'You should provide an Entity' })).min(1),
});

class PXExtractParagraphFromEntitiesController extends AbstractController<Request> {
  private useCase: PXExtractParagraphsFromEntities;

  constructor(dependencies: Dependencies) {
    super(dependencies);
    this.useCase = PXExtractParagraphsFromEntitiesFactory.createDefault(this.tenantName);
  }

  async handle(): Promise<void> {
    this.ensureUser();

    const dto = RequestSchema.parse(this.request.body);

    await this.useCase.execute({ ...dto, userId: this.user._id.toString() });

    this.ok();
  }
}

export { PXExtractParagraphFromEntitiesController };
