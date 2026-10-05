import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FilesDataSource } from '#api/core/application/contracts/FilesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import { FileNotFound } from '#api/core/domain/files/errors.js';
import { PDFDocument } from '#api/core/domain/files/PDFDocument.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { OcrEngine } from './contracts/OcrEngine.js';
import { OcrNotEnabled } from './errors/OcrNotEnabled.js';

type Deps = {
  settingsDS: SettingsDataSource;
  filesDS: FilesDataSource;
  fileStorage: FileStorage;
  ocrEngine: OcrEngine;
};

/** Whether OCR can be used: for the tenant, and on a given file. */
class OcrAvailabilityService {
  constructor(private readonly deps: Deps) {}

  async assertEnabled(): Promise<void> {
    const { settingsDS } = this.deps;
    const feature = await settingsDS.readFeature('ocr');
    if (!feature?.url || !(await settingsDS.readOcrServiceEnabled())) {
      throw new OcrNotEnabled();
    }
  }

  /** The file of that name, provided its content is in storage. */
  async storedFileNamed(filename: string): Promise<BaseFile> {
    const file = (await this.deps.filesDS.getByFilename(filename)).getDataOrThrow();
    if (!(await this.deps.fileStorage.fileExists(file))) {
      throw new FileNotFound(`The content of the file "${filename}" is not in storage`);
    }
    return file;
  }

  /** The file's language, when the service reads it. Asked live: the answer changes with it. */
  async readableLanguageOf(file: PDFDocument): Promise<LanguageISO6391 | undefined> {
    const { language } = file;
    return language !== undefined && (await this.deps.ocrEngine.supportsLanguage(language))
      ? language
      : undefined;
  }
}

export { OcrAvailabilityService };
