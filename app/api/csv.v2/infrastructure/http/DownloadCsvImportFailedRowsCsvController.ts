import { z } from 'zod';
import { pipeline } from 'stream/promises';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import {
  CsvImportDoesNotExistError,
  CsvImportFailedRowsCsvDoesNotExistError,
} from '../../domain/csvImporErrors.js';
import { CSVImportEntitiesFactories } from '../factories/CSVImportEntitiesFactories.js';

const ParamsSchema = z.object({
  id: z.string(),
});

export class DownloadCsvImportFailedRowsCsvController extends AbstractController {
  private setDownloadHeaders(filename: string) {
    this.response.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    this.response.setHeader('Content-Type', 'text/csv; charset=UTF-8');
  }

  private handleNotFoundError(error: Error): boolean {
    if (
      error instanceof CsvImportDoesNotExistError ||
      error instanceof CsvImportFailedRowsCsvDoesNotExistError
    ) {
      this.response.status(404).json({ message: error.message });
      return true;
    }

    return false;
  }

  protected async handle(): Promise<void> {
    const { id } = ParamsSchema.parse(this.request.params || {});
    const useCase = CSVImportEntitiesFactories.downloadCsvImportFailedRowsCsvUseCaseDefault();

    try {
      const { fileContents, filename } = await useCase.execute({ id });
      this.setDownloadHeaders(filename);
      await pipeline(fileContents.read(), this.response);
    } catch (error) {
      if (error instanceof Error && this.handleNotFoundError(error)) {
        return;
      }
      throw error;
    }
  }
}
