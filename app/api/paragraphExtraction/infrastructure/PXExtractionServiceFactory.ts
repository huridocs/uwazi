// @ts-expect-error TS(2307): Cannot find module '../config.js' or its correspon... Remove this comment to see the full error message
import { config } from '../config.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/infrastructure/Ht... Remove this comment to see the full error message
import { HttpClientFactory } from '../common.v2/infrastructure/HttpClientFactory.js';

import { PXExternalExtractionService } from './ExternalExtractionService/ExternalExtractionService.js';
import { PXExtractionService } from '../domain/PXExtractionService.js';

export class PXExtractionServiceFactory {
  static createDefault(): PXExtractionService {
    return new PXExternalExtractionService({
      url: config.externalServicesUrls.paragraphExtraction,
      httpClient: HttpClientFactory.createDefault(),
    });
  }
}
