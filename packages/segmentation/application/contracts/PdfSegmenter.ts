import { Readable } from 'stream';
import { DocumentLayout } from '../../domain/DocumentLayout.js';
import { IdempotencyKey } from '../../domain/IdempotencyKey.js';
import { SegmentationFailureReason } from '../../domain/SegmentationFailureReason.js';

/**
 * Where a successful result can be fetched from. Only the segmenter that produced it reads it;
 * to everyone else it is opaque, plain data that can travel in a job's params.
 */
type OutcomeHandle = Readonly<Record<string, string>>;

/**
 * What the service reported for one request. The key is absent when the service did not echo
 * one back — results of requests sent before keys existed.
 */
type SegmentationOutcome = { key?: IdempotencyKey; filename: string } & (
  | { succeeded: true; handle: OutcomeHandle }
  | { succeeded: false; reason: SegmentationFailureReason }
);

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

export type { PdfSegmenter, SegmentationRequest, OutcomeHandle, SegmentationOutcome };
