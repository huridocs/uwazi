import { z } from 'zod';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/infrastructure/Ab... Remove this comment to see the full error message
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
    // @ts-expect-error TS(2339): Property 'request' does not exist on type 'PXDelet... Remove this comment to see the full error message
    const dto = RequestSchema.parse(this.request.query);

    const useCase = PXDeleteExtractorFactory.createDefault();

    await useCase.execute(dto);

    const response: Response = { success: true };

    // @ts-expect-error TS(2339): Property 'jsonResponse' does not exist on type 'PX... Remove this comment to see the full error message
    this.jsonResponse(response);
  }
}

export { PXDeleteExtractorController };
