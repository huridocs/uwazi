import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from 'api/common.v2/AbstractController';

import { InputSchema, PXCreateExtractor } from '../application/PXCreateExtractor';

type Response = {
  extractorId: string;
};

type PXExtractorsControllersProps = {
  createExtractor: PXCreateExtractor;
} & AbstractControllerDependencies;

class PXCreateExtractorController extends AbstractController {
  createExtractor: PXCreateExtractor;

  constructor(dependencies: PXExtractorsControllersProps) {
    super(dependencies);
    this.createExtractor = dependencies.createExtractor;
  }

  async handle(): Promise<void> {
    const dto = InputSchema.parse(this.request.body);

    const output = await this.createExtractor.execute(dto);

    const response: Response = {
      extractorId: output.id,
    };

    this.jsonResponse(response);
  }
}

export { PXCreateExtractorController };
