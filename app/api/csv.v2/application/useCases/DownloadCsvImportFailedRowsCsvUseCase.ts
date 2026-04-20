import path from 'path';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { CsvImportEntitiesImportsDataSource } from '../contracts/CsvImportEntitiesImportsDataSource.js';
import { CsvImportFailedRowsCsvDoesNotExistError } from '../../domain/csvImporErrors.js';

type Deps = {
  csvImportEntitiesImportsDS: CsvImportEntitiesImportsDataSource;
  fileStorage: FileStorage;
};

type Input = {
  id: string;
};

type Output = {
  fileContents: FileContents;
  filename: string;
};

const parseReportPath = (reportPath: string) => ({
  filename: path.posix.basename(reportPath),
  destination: path.posix.dirname(reportPath),
});

const ensureReadable = async (fileContents: FileContents) => {
  const iterator = fileContents.read()[Symbol.asyncIterator]();
  await iterator.next();
};

const getReportPathOrThrow = (importId: string, reportPath?: string): string => {
  if (!reportPath) {
    throw new CsvImportFailedRowsCsvDoesNotExistError(importId);
  }

  return reportPath;
};

class DownloadCsvImportFailedRowsCsvUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const csvImport = (
      await this.deps.csvImportEntitiesImportsDS.getById(input.id)
    ).getDataOrThrow();
    const reportPath = getReportPathOrThrow(input.id, csvImport.rowErrors?.reportPath);
    const { filename, destination } = parseReportPath(reportPath);
    const fileInput = {
      type: 'customPath',
      destination,
      filename,
    } as const;

    try {
      await ensureReadable(this.deps.fileStorage.getFile(fileInput));
    } catch {
      throw new CsvImportFailedRowsCsvDoesNotExistError(input.id);
    }

    return {
      fileContents: this.deps.fileStorage.getFile(fileInput),
      filename,
    };
  }
}

export { DownloadCsvImportFailedRowsCsvUseCase };
