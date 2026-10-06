import { GetOcrStatus } from '../../application/GetOcrStatus.js';
import {
  OcrAvailabilityOverrides,
  OcrAvailabilityServiceFactory,
} from './OcrAvailabilityServiceFactory.js';
import { OcrRecordDataSourceFactory } from './OcrRecordDataSourceFactory.js';

class GetOcrStatusFactory {
  static default(overrides: OcrAvailabilityOverrides = {}): GetOcrStatus {
    return new GetOcrStatus({
      ocrDS: OcrRecordDataSourceFactory.default(),
      ocrAvailability: OcrAvailabilityServiceFactory.default(overrides),
    });
  }
}

export { GetOcrStatusFactory };
