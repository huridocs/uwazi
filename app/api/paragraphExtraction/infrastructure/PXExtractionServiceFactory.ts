import { config } from '#api/config.js';
import { HttpClientFactory } from '#api/common.v2/infrastructure/HttpClientFactory.js';

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
