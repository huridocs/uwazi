import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { PDFDocument } from '#api/core/domain/files/PDFDocument.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { OcrRecord } from '../domain/OcrRecord.js';
import { OcrStatus } from '../domain/OcrStatus.js';
import { OcrJobs } from './contracts/OcrJobs.js';
import { OcrRecordDataSource } from './contracts/OcrRecordDataSource.js';
import { FileIsNotADocument } from './errors/FileIsNotADocument.js';
import { OcrAlreadyActive } from './errors/OcrAlreadyActive.js';
import { OcrLanguageNotSupported } from './errors/OcrLanguageNotSupported.js';
import { OcrAvailabilityService } from './OcrAvailabilityService.js';

type Input = { filename: string };

type Deps = {
  ocrDS: OcrRecordDataSource;
  ocrAvailability: OcrAvailabilityService;
  jobs: OcrJobs;
  idGenerator: IdGenerator;
};

/**
 * Asks for the OCR of a document: records the request and dispatches its submission to the OCR
 * service. A file has at most one record; a failed one is queued again, anything else refuses.
 */
class RequestOcr extends AbstractUseCase<Input, void, Deps> {
  async execute({ filename }: Input): Promise<void> {
    await this.deps.ocrAvailability.assertEnabled();
    const { document, language } = await this.readableDocumentNamed(filename);

    const { record, isNew } = await this.recordFor({ id: document.id, filename, language });
    await this.transactionManager.run(async () => {
      await this.store(record, isNew);
      await this.deps.jobs.submitOcr(record.id);
    });
  }

  /** A document in a language the service reads. */
  private async readableDocumentNamed(filename: string) {
    const { ocrAvailability } = this.deps;
    const file = await ocrAvailability.storedFileNamed(filename);
    if (file.type !== 'document') {
      throw new FileIsNotADocument(filename);
    }
    const document = file as PDFDocument;
    const language = await ocrAvailability.readableLanguageOf(document);
    if (!language) {
      throw new OcrLanguageNotSupported(document.language);
    }
    return { document, language };
  }

  private async recordFor(source: { id: string; filename: string; language: LanguageISO6391 }) {
    const existing = await this.deps.ocrDS.getBySourceFileId(source.id);
    if (!existing) {
      const record = OcrRecord.request({
        id: this.deps.idGenerator.generate(),
        sourceFileId: source.id,
        filename: source.filename,
        language: source.language,
      });
      return { record, isNew: true };
    }
    if (existing.status !== OcrStatus.FAILED) {
      throw new OcrAlreadyActive(source.filename);
    }
    existing.retry();
    return { record: existing, isNew: false };
  }

  /** A new record can lose the race for its file to a concurrent request. */
  private async store(record: OcrRecord, isNew: boolean) {
    if (!isNew) {
      await this.deps.ocrDS.save(record);
      return;
    }
    if (!(await this.deps.ocrDS.create(record))) {
      throw new OcrAlreadyActive(record.filename);
    }
  }
}

export { RequestOcr };
export type { Input as RequestOcrInput };
