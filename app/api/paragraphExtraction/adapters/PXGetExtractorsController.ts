import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
  // @ts-expect-error TS(2307): Cannot find module '../common.v2/infrastructure/Ab... Remove this comment to see the full error message
} from '../common.v2/infrastructure/AbstractController.js';

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
    // @ts-expect-error TS(2339): Property 'jsonResponse' does not exist on type 'PX... Remove this comment to see the full error message
    this.jsonResponse(output);
  }
}

export { PXGetExtractorsController };
