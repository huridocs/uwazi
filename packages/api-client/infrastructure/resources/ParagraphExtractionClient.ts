import { PXGetEntityParagraphsController } from '#api/paragraphExtraction/adapters/PXGetEntityParagraphsController.js';
import { PXGetExtractorStatusesController } from '#api/paragraphExtraction/adapters/PXGetExtractorStatusesController.js';
import { PXGetExtractorsController } from '#api/paragraphExtraction/adapters/PXGetExtractorsController.js';

import type { ParagraphExtractionResource } from '../../application/ServerApiClient.js';
import type {
  PXEntityParagraphsQuery,
  PXEntityParagraphsResponse,
  PXExtractorsResponse,
  PXExtractorStatusesQuery,
  PXExtractorStatusesResponse,
} from '../../application/contracts/ParagraphExtraction.js';
import type { ControllerInvoker } from '../ControllerInvoker.js';

class ParagraphExtractionClient implements ParagraphExtractionResource {
  constructor(private readonly invoker: ControllerInvoker) {}

  async getExtractors() {
    return this.invoker.invoke<PXExtractorsResponse>(PXGetExtractorsController);
  }

  async getExtractorStatuses(query: PXExtractorStatusesQuery) {
    return this.invoker.invoke<PXExtractorStatusesResponse>(
      PXGetExtractorStatusesController,
      query
    );
  }

  async getEntityParagraphs(query: PXEntityParagraphsQuery) {
    return this.invoker.invoke<PXEntityParagraphsResponse>(PXGetEntityParagraphsController, query);
  }
}

export { ParagraphExtractionClient };
