import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FilesDataSource } from '#api/core/application/contracts/FilesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { FileNotFound } from '#api/core/domain/files/errors.js';
import { PDFDocument } from '#api/core/domain/files/PDFDocument.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { LanguageUtils } from '#shared/language/index.js';
import { OcrRecord } from '../domain/OcrRecord.js';
import { OcrStatus } from '../domain/OcrStatus.js';
import { OcrEngine } from './contracts/OcrEngine.js';
import { OcrJobs } from './contracts/OcrJobs.js';
import { OcrRecordDataSource } from './contracts/OcrRecordDataSource.js';
import { FileIsNotADocument } from './errors/FileIsNotADocument.js';
import { OcrAlreadyActive } from './errors/OcrAlreadyActive.js';
import { OcrLanguageNotSupported } from './errors/OcrLanguageNotSupported.js';
import { OcrNotEnabled } from './errors/OcrNotEnabled.js';

type Input = { filename: string };

type Deps = {
  ocrDS: OcrRecordDataSource;
  filesDS: FilesDataSource;
  fileStorage: Pick<FileStorage, 'fileExists'>;
  settingsDS: SettingsDataSource;
  ocrEngine: OcrEngine;
  jobs: OcrJobs;
  idGenerator: IdGenerator;
  now: () => number;
};

/**
 * Asks for the OCR of a document: records the request and dispatches its submission to the OCR
 * service. A file has at most one record; a failed one is queued again, anything else refuses.
 */
class RequestOcr extends AbstractUseCase<Input, void, Deps> {
  async execute({ filename }: Input): Promise<void> {
    await this.assertEnabled();
    const file = await this.documentNamed(filename);

    //cc: uwazi should always speak ISO 639-1, it's the job of ocr engine implementation to change to ISO 639-3, not application layer.
    const language = LanguageUtils.fromISO639_1(file.language ?? '').ISO639_3;
    if (!(await this.deps.ocrEngine.supportsLanguage(language))) {
      throw new OcrLanguageNotSupported(language);
    }

    const { record, isNew } = await this.recordFor({ id: file.id, filename, language });
    await this.transactionManager.run(async () => {
      await this.store(record, isNew);
      await this.deps.jobs.submitOcr(record.id);
    });
  }

  private async documentNamed(filename: string) {
    const file = (await this.deps.filesDS.getByFilename(filename)).getDataOrThrow();
    if (!(await this.deps.fileStorage.fileExists(file))) {
      throw new FileNotFound(`The content of the file "${filename}" is not in storage`);
    }
    if (file.type !== 'document') {
      throw new FileIsNotADocument(filename);
    }
    return file as PDFDocument;
  }

  private async assertEnabled() {
    const { settingsDS } = this.deps;
    const feature = await settingsDS.readFeature('ocr');
    if (!feature?.url || !(await settingsDS.readOcrServiceEnabled())) {
      throw new OcrNotEnabled();
    }
  }

  private async recordFor(source: { id: string; filename: string; language: string }) {
    const existing = await this.deps.ocrDS.getBySourceFileId(source.id);
    if (!existing) {
      const record = OcrRecord.request({
        id: this.deps.idGenerator.generate(),
        sourceFileId: source.id,
        filename: source.filename,
        language: source.language,
        now: this.deps.now(),
      });
      return { record, isNew: true };
    }
    if (existing.status !== OcrStatus.FAILED) {
      throw new OcrAlreadyActive(source.filename);
    }
    existing.retry(this.deps.now());
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
