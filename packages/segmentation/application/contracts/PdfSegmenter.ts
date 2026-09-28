import { Readable } from 'stream';
import { DocumentLayout } from '../../domain/DocumentLayout.js';
import { IdempotencyKey } from '../../domain/IdempotencyKey.js';
import { OutcomeHandle } from './SegmentationOutcome.js';

//cc: let's colocate the methods types in this file, reducing amount of files. SegmentationRequest, OutcomeHandle.

type SegmentationRequest = {
  key: IdempotencyKey;
  filename: string;
  content: Buffer;
};

/** The service that turns a PDF into its layout. It answers asynchronously, one request at a time. */
interface PdfSegmenter {
  /** Hands the PDF over. The outcome arrives later, through the result listener. */
  submit(request: SegmentationRequest): Promise<void>;

  /** Requests handed over and not yet picked up by the service. */
  backlogSize(): Promise<number>;

  /** Fetches a successful result. The service hands each result out once. */
  fetchLayout(handle: OutcomeHandle): Promise<{ layout: DocumentLayout; xml: Readable }>;
}

export type { PdfSegmenter, SegmentationRequest };
