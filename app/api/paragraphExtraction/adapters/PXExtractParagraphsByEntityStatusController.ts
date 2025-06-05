import { z } from 'zod';
import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from 'api/common.v2/infrastructure/AbstractController';

import { PXExtractParagraphsByEntityStatusFactory } from '../infrastructure/PXExtractParagraphByEntityStatusFactory ';
import { EntityStatus } from '../domain/PXEntityStatusModel';

const RequestSchema = z.object({
  extractorId: z.string({ message: 'You should provide an Extractor' }),
});

type Request = z.infer<typeof RequestSchema>;

type Dependencies = AbstractControllerDependencies<Request>;

class PXExtractParagraphsByEntityStatusController extends AbstractController<Request> {
  constructor(dependencies: Dependencies) {
    super(dependencies);
  }

  async handle(): Promise<void> {
    const { extractorId } = RequestSchema.parse(this.request.body);

    this.ensureUser();

    const useCase = await PXExtractParagraphsByEntityStatusFactory.createDefault({
      tenantName: this.tenantName,
    });

    await useCase.execute({
      userId: this.user._id.toString()!,
      status: EntityStatus.New,
      extractorId,
    });

    this.ok();
  }
}

export { PXExtractParagraphsByEntityStatusController };
