import { config } from 'api/config';
import { HttpClientFactory } from 'api/common.v2/infrastructure/HttpClientFactory';

import { PXExternalExtractionService } from './ExternalExtractionService/ExternalExtractionService';
import { PXExtractionService } from '../domain/PXExtractionService';

export class PXExtractionServiceFactory {
  static createDefault(): PXExtractionService {
    return new PXExternalExtractionService({
      url: config.externalServicesUrls.paragraphExtraction,
      httpClient: HttpClientFactory.createDefault(),
    });
  }
}
