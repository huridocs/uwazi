import { ResultType } from '#api/core/libs/Result.js';
import { DiskFile } from '#api/core/infrastructure/files/DiskFile.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { LanguageSchema } from '#shared/types/commonTypes.js';

export interface PDFService {
  extractText(file: FileContents): Promise<
    ResultType<
      {
        pages: { [pageNumber: string]: string };
        totalPages: number;
        language: LanguageSchema;
      },
      Error
    >
  >;
  createThumbnail(file: FileContents): Promise<ResultType<DiskFile, Error>>;
}
