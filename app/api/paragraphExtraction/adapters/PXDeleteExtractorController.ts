import { z } from 'zod';

import { AbstractController } from '../common.v2/infrastructure/AbstractController.js';
import { PXDeleteExtractorFactory } from '../infrastructure/PXDeleteExtractorFactory';

const RequestSchema = z.object({
  id: z.string({ message: 'You should provide an Extractor ID' }),
});

type Request = z.infer<typeof RequestSchema>;

type Response = {
  success: boolean;
};

class PXDeleteExtractorController extends AbstractController<Request> {
  protected async handle(): Promise<void> {
    const dto = RequestSchema.parse(this.request.query);

    const useCase = PXDeleteExtractorFactory.createDefault();

    await useCase.execute(dto);

    const response: Response = { success: true };

    this.jsonResponse(response);
  }
}

export { PXDeleteExtractorController };
