import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from '#api/common.v2/infrastructure/AbstractController.js';
import { Authorize } from '#api/core/infrastructure/express/decorators/Authorize.js';
import { RequireFeatureFlag } from '#api/core/infrastructure/express/decorators/RequireFeatureFlag.js';

import { PXExtractorsQueryService } from '../domain/PXExtractorsQueryService.js';
import { PXExtractorsQueryServiceFactory } from '../infrastructure/PXExtractorsQueryServiceFactory.js';

type PXExtractorsControllersProps = AbstractControllerDependencies;

class PXGetExtractorsController extends AbstractController {
  queryService: PXExtractorsQueryService;

  constructor(dependencies: PXExtractorsControllersProps) {
    super(dependencies);
    this.queryService = PXExtractorsQueryServiceFactory.createDefault();
  }

  @Authorize(['admin', 'editor'])
  @RequireFeatureFlag('paragraphExtraction')
  async handle(): Promise<void> {
    const output = await this.queryService.getExtractors().all();
    this.jsonResponse(output);
  }
}

export { PXGetExtractorsController };
