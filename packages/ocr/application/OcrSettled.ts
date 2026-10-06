import { OcrRecord } from '../domain/OcrRecord.js';
import { OcrStatus } from '../domain/OcrStatus.js';

type OcrSettled = { status: OcrStatus.READY | OcrStatus.FAILED; sourceFileId: string } | undefined;

class OcrSettlement {
  static of({ status, sourceFileId }: OcrRecord): OcrSettled {
    if (sourceFileId === null) {
      return undefined;
    }
    return status === OcrStatus.READY || status === OcrStatus.FAILED
      ? { status, sourceFileId }
      : undefined;
  }
}

export { OcrSettlement };
export type { OcrSettled };
