import { PDFDocument } from '#api/core/domain/files/PDFDocument.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { OcrStatus } from '../domain/OcrStatus.js';
import { OcrRecordDataSource } from './contracts/OcrRecordDataSource.js';
import { FileIsNotADocument } from './errors/FileIsNotADocument.js';
import { OcrAvailabilityService } from './OcrAvailabilityService.js';

type Input = { filename: string };

type OcrFileStatus = {
  status: OcrStatus | 'none' | 'unsupportedLanguage';
  lastUpdated?: number;
};

type Deps = {
  ocrDS: OcrRecordDataSource;
  ocrAvailability: OcrAvailabilityService;
};

/**
 * Reports where a file stands with OCR. A file is found through its record whether it is the
 * source or the result. When OCR could be asked for — no record yet, or a failed one — the service
 * is asked live whether it reads the file's language, since the answer can change with the
 * service. A record in the queue or ready is reported as it is, so the service is not needed.
 */
class GetOcrStatus extends AbstractUseCase<Input, OcrFileStatus, Deps> {
  async execute({ filename }: Input): Promise<OcrFileStatus> {
    const { ocrAvailability } = this.deps;
    await ocrAvailability.assertEnabled();
    const file = await ocrAvailability.storedFileNamed(filename);

    const [record] = await this.deps.ocrDS.getForFiles([file.id]);
    if (!record && file.type !== 'document') {
      throw new FileIsNotADocument(filename);
    }

    const canBeRequested = !record || record.status === OcrStatus.FAILED;
    if (canBeRequested && !(await ocrAvailability.readableLanguageOf(file as PDFDocument))) {
      return { status: 'unsupportedLanguage' };
    }
    return record ? { status: record.status, lastUpdated: record.lastUpdated } : { status: 'none' };
  }
}

export { GetOcrStatus };
export type { OcrFileStatus, Input as GetOcrStatusInput };
