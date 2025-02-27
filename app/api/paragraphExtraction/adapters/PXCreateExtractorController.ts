import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from 'api/common.v2/AbstractController';

import { InputSchema, PXCreateExtractor } from '../application/PXCreateExtractor';
import { PXCreateExtractorFactory } from '../infrastructure/PXCreateExtractorFactory';

type Response = {
  extractorId: string;
};

type Dependencies = AbstractControllerDependencies;
class PXCreateExtractorController extends AbstractController {
  private useCase: PXCreateExtractor;

  constructor(dependencies: Dependencies) {
    super(dependencies);
    this.useCase = PXCreateExtractorFactory.createDefault();
  }

  protected async handle(): Promise<void> {
    const dto = InputSchema.parse(this.request.body);

    const output = await this.useCase.execute(dto);

    const response: Response = {
      extractorId: output.id,
    };

    this.jsonResponse(response);
  }
}

export { PXCreateExtractorController };
