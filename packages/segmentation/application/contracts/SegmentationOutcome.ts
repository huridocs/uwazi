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

export type { OutcomeHandle, SegmentationOutcome };
