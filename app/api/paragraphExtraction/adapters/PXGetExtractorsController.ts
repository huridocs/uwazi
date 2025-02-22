import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from 'api/common.v2/AbstractController';

import { PXExtractorsQueryService } from '../domain/PXExtractorsQueryService';

type PXExtractorsControllersProps = {
  extractorsQueryService: PXExtractorsQueryService;
} & AbstractControllerDependencies;

class PXGetExtractorsController extends AbstractController {
  extractorsQueryService: PXExtractorsQueryService;

  constructor(dependencies: PXExtractorsControllersProps) {
    super(dependencies);
    this.extractorsQueryService = dependencies.extractorsQueryService;
  }

  async handle(): Promise<void> {
    const output = await this.extractorsQueryService.getExtractors({}).all();

    this.jsonResponse(output);
  }
}

export { PXGetExtractorsController };
