import { Readable } from 'stream';
import { OcrEngine, OcrRequest, OutcomeHandle } from '../contracts/OcrEngine.js';

/** The OCR service, across the one boundary the use case specs substitute. */
class FakeOcrEngine implements OcrEngine {
  submitted: OcrRequest[] = [];

  backlog = 0;

  failWith: Error | undefined;

  supportedLanguages = ['en', 'es'];

  asked: string[] = [];

  result: { pdf: Readable; mimetype: string } | undefined;

  async submit(request: OcrRequest) {
    if (this.failWith) {
      throw this.failWith;
    }
    this.submitted.push(request);
  }

  async backlogSize() {
    return this.backlog;
  }

  async fetchResult(_handle: OutcomeHandle): Promise<{ pdf: Readable; mimetype: string }> {
    if (!this.result) {
      throw new Error('no result set on the fake engine');
    }
    return this.result;
  }

  async supportsLanguage(language: string) {
    this.asked.push(language);
    return this.supportedLanguages.includes(language);
  }
}

export { FakeOcrEngine };
