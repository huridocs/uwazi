import { z } from 'zod';
import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from 'api/common.v2/infrastructure/AbstractController';

import { PXExtractParagraphsByEntityStatusFactory } from '../infrastructure/PXExtractParagraphByEntityStatusFactory ';
import { EntityStatus } from '../domain/PXEntityStatusModel';

type Request = z.infer<typeof RequestSchema>;

type Dependencies = AbstractControllerDependencies<Request>;

const RequestSchema = z.object({
  extractorId: z.string({ message: 'You should provide an Extractor' }),
  status: z.nativeEnum(EntityStatus),
});

class PXExtractParagraphsByEntityStatusController extends AbstractController<Request> {
  constructor(dependencies: Dependencies) {
    super(dependencies);
  }

  async handle(): Promise<void> {
    this.ensureUser();

    const useCase = await PXExtractParagraphsByEntityStatusFactory.createDefault({
      tenantName: this.tenantName,
    });

    const { extractorId } = RequestSchema.parse(this.request.body);

    await useCase.execute({
      userId: this.user._id.toString()!,
      status: EntityStatus.New,
      extractorId,
    });

    this.ok();
  }
}

export { PXExtractParagraphsByEntityStatusController };
