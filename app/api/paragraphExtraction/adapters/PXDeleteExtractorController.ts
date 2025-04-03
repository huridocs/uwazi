import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';

import { InputSchema } from '../application/PXDeleteExtractor';
import { PXDeleteExtractorFactory } from '../infrastructure/PXDeleteExtractorFactory';

type Response = {
  success: boolean;
};

class PXDeleteExtractorController extends AbstractController {
  protected async handle(): Promise<void> {
    const useCase = PXDeleteExtractorFactory.createDefault();
    const dto = InputSchema.parse(this.request.query);

    await useCase.execute(dto);

    const response: Response = { success: true };

    this.jsonResponse(response);
  }
}

export { PXDeleteExtractorController };
