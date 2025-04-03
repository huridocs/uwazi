import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';

import { InputSchema } from '../application/PXDeleteExtractor';
import { PXDeleteExtractorFactory } from '../infrastructure/PXDeleteExtractorFactory';

type Response = {
  extractorId: string;
};

class PXDeleteExtractorController extends AbstractController {
  protected async handle(): Promise<void> {
    const useCase = PXDeleteExtractorFactory.createDefault();
    const dto = InputSchema.parse(this.request.body);

    const output = await useCase.execute(dto);

    const response: Response = {
      extractorId: output.id,
    };

    this.jsonResponse(response);
  }
}

export { PXDeleteExtractorController };
