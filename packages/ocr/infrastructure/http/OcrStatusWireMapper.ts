import { OcrFileStatus } from '../../application/GetOcrStatus.js';
import { OcrStatus } from '../../domain/OcrStatus.js';

/** What `GET /api/files/:filename/ocr` answers, as clients have always read it. */
type OcrStatusWire = {
  status: 'noOCR' | 'inQueue' | 'cannotProcess' | 'withOCR' | 'unsupported_language';
  lastUpdated?: number;
};

const WIRE_STATUS: Record<OcrFileStatus['status'], OcrStatusWire['status']> = {
  none: 'noOCR',
  [OcrStatus.QUEUED]: 'inQueue',
  [OcrStatus.PROCESSING]: 'inQueue',
  [OcrStatus.READY]: 'withOCR',
  [OcrStatus.FAILED]: 'cannotProcess',
  unsupportedLanguage: 'unsupported_language',
};

class OcrStatusWireMapper {
  static toWire({ status, lastUpdated }: OcrFileStatus): OcrStatusWire {
    return {
      status: WIRE_STATUS[status],
      ...(lastUpdated !== undefined && { lastUpdated }),
    };
  }
}

export { OcrStatusWireMapper };
export type { OcrStatusWire };
