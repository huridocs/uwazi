import { ResultType } from 'api/core/libs/Result';
import { File } from 'api/files.v2/model/File';
import { LanguageSchema } from 'shared/types/commonTypes';

export interface PDFService {
  extractText(file: File): Promise<
    ResultType<
      {
        pages: { [pageNumber: string]: string };
        totalPages: number;
        language: LanguageSchema;
      },
      Error
    >
  >;
  createThumbnail(file: File): Promise<ResultType<File, Error>>;
}
