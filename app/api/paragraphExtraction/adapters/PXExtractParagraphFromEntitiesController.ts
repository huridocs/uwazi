import { z } from 'zod';
import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from 'api/common.v2/infrastructure/AbstractController';

import { PXExtractParagraphsFromEntitiesFactory } from '../infrastructure/PXExtractParagraphsFromEntitiesFactory';

type Dependencies = AbstractControllerDependencies<Request>;

const RequestSchema = z.object({
  extractorId: z.string({ message: 'You should provide an Extractor' }),
  entitySharedIds: z.array(z.string({ message: 'You should provide an Entity' })).min(1),
});

type Request = z.infer<typeof RequestSchema>;

class PXExtractParagraphFromEntitiesController extends AbstractController<Request> {
  constructor(dependencies: Dependencies) {
    super(dependencies);
  }

  async handle(): Promise<void> {
    const dto = RequestSchema.parse(this.request.body);

    this.ensureUser();

    const useCase = await PXExtractParagraphsFromEntitiesFactory.createDefault({
      tenantName: this.tenantName,
    });

    await useCase.execute({ ...dto, userId: this.user._id.toString() });

    this.ok();
  }
}

export { PXExtractParagraphFromEntitiesController };
