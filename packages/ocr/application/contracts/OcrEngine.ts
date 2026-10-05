import { Readable } from 'stream';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { IdempotencyKey } from '../../domain/IdempotencyKey.js';
import { OcrFailureReason } from '../../domain/OcrFailureReason.js';

/**
 * Where a successful result can be fetched from. Only the engine that produced it reads it; to
 * everyone else it is opaque, plain data that can travel in a job's params.
 */
type OutcomeHandle = Readonly<Record<string, string>>;

/**
 * What the service reported for one request. The key is absent when the service did not echo
 * one back — results of requests sent before keys existed.
 */
type OcrOutcome = { key?: IdempotencyKey; filename: string } & (
  { succeeded: true; handle: OutcomeHandle } | { succeeded: false; reason: OcrFailureReason }
);

type OcrRequest = {
  key: IdempotencyKey;
  filename: string;
  language: LanguageISO6391;
  content: Buffer;
};

/** The service that adds a text layer to a scanned PDF. It answers asynchronously. */
interface OcrEngine {
  /** Hands the PDF over. The outcome arrives later, through the result listener. */
  submit(request: OcrRequest): Promise<void>;

  /** Requests handed over and not yet picked up by the service. */
  backlogSize(): Promise<number>;

  /** Fetches a successful result. The service hands each result out once. */
  fetchResult(handle: OutcomeHandle): Promise<{ pdf: Readable; mimetype: string }>;

  /** Whether the service can read text in the language. */
  supportsLanguage(language: LanguageISO6391): Promise<boolean>;
}

export type { OcrEngine, OcrRequest, OutcomeHandle, OcrOutcome };
