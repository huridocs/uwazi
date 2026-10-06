/** Work the module hands to the job queue. */
interface OcrJobs {
  /** Sends the record's PDF to the OCR service; with `delayMs`, not before that much time has passed. */
  submitOcr(recordId: string, options?: { delayMs?: number }): Promise<void>;
}

export type { OcrJobs };
