import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from 'api/common.v2/infrastructure/AbstractController';

import { PXExtractorsQueryService } from '../domain/PXExtractorsQueryService';
import { PXExtractorsQueryServiceFactory } from '../infrastructure/PXExtractorsQueryServiceFactory';

type PXExtractorsControllersProps = AbstractControllerDependencies;

class PXGetExtractorsController extends AbstractController {
  queryService: PXExtractorsQueryService;

  constructor(dependencies: PXExtractorsControllersProps) {
    super(dependencies);
    this.queryService = PXExtractorsQueryServiceFactory.createDefault();
  }

  async handle(): Promise<void> {
    const output = await this.queryService.getExtractors().all();
    this.jsonResponse(output);
  }
}

export { PXGetExtractorsController };
