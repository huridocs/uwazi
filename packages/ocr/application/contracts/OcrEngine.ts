import { Readable } from 'stream';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { IdempotencyKey } from '../../domain/IdempotencyKey.js';
import { OcrFailureReason } from '../../domain/OcrFailureReason.js';

type OutcomeHandle = Readonly<Record<string, string>>;

type OcrOutcome = { key?: IdempotencyKey; filename: string } & (
  { succeeded: true; handle: OutcomeHandle } | { succeeded: false; reason: OcrFailureReason }
);

type OcrResultFile = { pdf: Readable; mimetype: string };

type OcrRequest = {
  key: IdempotencyKey;
  filename: string;
  language: LanguageISO6391;
  content: Buffer;
};

/** The service that adds a text layer to a scanned PDF. */
interface OcrEngine {
  /** Hands the PDF over. The outcome arrives later, through the result listener. */
  submit(request: OcrRequest): Promise<void>;

  /** Requests handed over and not yet picked up by the service. */
  backlogSize(): Promise<number>;

  /** Fetches a successful result. The service hands each result out once. */
  fetchResult(handle: OutcomeHandle): Promise<OcrResultFile>;

  /** Whether the service can read text in the language. */
  supportsLanguage(language: LanguageISO6391): Promise<boolean>;
}

export type { OcrEngine, OcrRequest, OcrResultFile, OutcomeHandle, OcrOutcome };
