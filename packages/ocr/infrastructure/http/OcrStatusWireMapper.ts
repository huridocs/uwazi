import { OcrFileStatus } from '../../application/GetOcrStatus.js';
import { OcrStatus } from '../../domain/OcrStatus.js';
import { GetOcrStatusResponse } from './GetOcrStatusResponse.js';

const WIRE_STATUS: Record<OcrFileStatus['status'], GetOcrStatusResponse['status']> = {
  none: 'noOCR',
  [OcrStatus.QUEUED]: 'inQueue',
  [OcrStatus.PROCESSING]: 'inQueue',
  [OcrStatus.READY]: 'withOCR',
  [OcrStatus.FAILED]: 'cannotProcess',
  unsupportedLanguage: 'unsupported_language',
};

class OcrStatusWireMapper {
  static toWire({ status, lastUpdated }: OcrFileStatus): GetOcrStatusResponse {
    return {
      status: WIRE_STATUS[status],
      ...(lastUpdated !== undefined && { lastUpdated }),
    };
  }
}

export { OcrStatusWireMapper };
