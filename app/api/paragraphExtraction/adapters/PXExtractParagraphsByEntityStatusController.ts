import { z } from 'zod';
import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
  // @ts-expect-error TS(2307): Cannot find module '../common.v2/infrastructure/Ab... Remove this comment to see the full error message
} from '../common.v2/infrastructure/AbstractController.js';

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
    // @ts-expect-error TS(2339): Property 'request' does not exist on type 'PXExtra... Remove this comment to see the full error message
    const { extractorId } = RequestSchema.parse(this.request.body);

    // @ts-expect-error TS(2339): Property 'ensureUser' does not exist on type 'PXEx... Remove this comment to see the full error message
    this.ensureUser();

    const useCase = await PXExtractParagraphsByEntityStatusFactory.createDefault({
      // @ts-expect-error TS(2339): Property 'tenantName' does not exist on type 'PXEx... Remove this comment to see the full error message
      tenantName: this.tenantName,
    });

    await useCase.execute({
      // @ts-expect-error TS(2339): Property 'user' does not exist on type 'PXExtractP... Remove this comment to see the full error message
      userId: this.user._id.toString()!,
      status: EntityStatus.New,
      extractorId,
    });

    // @ts-expect-error TS(2339): Property 'ok' does not exist on type 'PXExtractPar... Remove this comment to see the full error message
    this.ok();
  }
}

export { PXExtractParagraphsByEntityStatusController };
