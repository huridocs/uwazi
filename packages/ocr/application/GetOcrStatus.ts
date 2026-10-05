import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FilesDataSource } from '#api/core/application/contracts/FilesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { FileNotFound } from '#api/core/domain/files/errors.js';
import { PDFDocument } from '#api/core/domain/files/PDFDocument.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { OcrStatus } from '../domain/OcrStatus.js';
import { OcrEngine } from './contracts/OcrEngine.js';
import { OcrRecordDataSource } from './contracts/OcrRecordDataSource.js';
import { FileIsNotADocument } from './errors/FileIsNotADocument.js';
import { OcrNotEnabled } from './errors/OcrNotEnabled.js';

type Input = { filename: string };

/** Where a file stands with OCR: its record's status, `none` without one, or a language the service cannot read. */
type OcrFileStatus = {
  status: OcrStatus | 'none' | 'unsupportedLanguage';
  lastUpdated?: number;
};

type Deps = {
  ocrDS: OcrRecordDataSource;
  filesDS: FilesDataSource;
  fileStorage: Pick<FileStorage, 'fileExists'>;
  settingsDS: SettingsDataSource;
  ocrEngine: OcrEngine;
};

/**
 * Reports where a file stands with OCR. A file is found through its record whether it is the
 * source or the result. Unless the record is ready, the service is asked live whether it reads the
 * file's language, since the answer can change with the service.
 */
class GetOcrStatus extends AbstractUseCase<Input, OcrFileStatus, Deps> {
  async execute({ filename }: Input): Promise<OcrFileStatus> {
    await this.assertEnabled();
    const file = (await this.deps.filesDS.getByFilename(filename)).getDataOrThrow();
    if (!(await this.deps.fileStorage.fileExists(file))) {
      throw new FileNotFound(`The content of the file "${filename}" is not in storage`);
    }

    const [record] = await this.deps.ocrDS.getForFiles([file.id]);
    if (!record && file.type !== 'document') {
      throw new FileIsNotADocument(filename);
    }

    if (record?.status !== OcrStatus.READY && !(await this.readsLanguageOf(file as PDFDocument))) {
      return { status: 'unsupportedLanguage' };
    }
    return record ? { status: record.status, lastUpdated: record.lastUpdated } : { status: 'none' };
  }

  private async assertEnabled() {
    const { settingsDS } = this.deps;
    const feature = await settingsDS.readFeature('ocr');
    if (!feature?.url || !(await settingsDS.readOcrServiceEnabled())) {
      throw new OcrNotEnabled();
    }
  }

  private async readsLanguageOf(file: PDFDocument) {
    const { language } = file;
    return language !== undefined && this.deps.ocrEngine.supportsLanguage(language);
  }
}

export { GetOcrStatus };
export type { OcrFileStatus, Input as GetOcrStatusInput };
