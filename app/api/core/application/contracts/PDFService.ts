import { ResultType } from 'api/core/libs/Result';
import { DiskFile } from 'api/core/infrastructure/files/DiskFile';
import { FileContents } from 'api/core/domain/files/FileContents';
import { LanguageSchema } from 'shared/types/commonTypes';

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
