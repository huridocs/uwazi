import { Request } from 'express';

import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from 'api/common.v2/AbstractController';

import { Input, InputSchema, PXCreateExtractor } from '../application/PXCreateExtractor';

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

    this.app.post('paragraphExtraction/extractors', this.handle.bind(this));
  }

  async handle(request: Request): Promise<void> {
    const dto: Input = {
      sourceTemplateId: request.body.sourceTemplateId,
      targetTemplateId: request.body.targetTemplateId,
      paragraphNumberPropertyId: request.body.paragraphNumberPropertyId,
      paragraphPropertyId: request.body.paragraphPropertyId,
    };

    InputSchema.parse(dto);

    const output = await this.createExtractor.execute(dto);

    const response: Response = {
      extractorId: output.id,
    };

    this.jsonResponse(response);
  }
}

export { PXCreateExtractorController };
