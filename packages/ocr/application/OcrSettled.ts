import { OcrRecord } from '../domain/OcrRecord.js';
import { OcrStatus } from '../domain/OcrStatus.js';

/**
 * A record that reached its end — ready or failed — while it still has a source file; whoever
 * drives the use case tells the user. Undefined when nothing settled.
 */
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
