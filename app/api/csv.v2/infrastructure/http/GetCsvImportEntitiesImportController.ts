import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { CsvImportDoesNotExistError } from '../../domain/csvImporErrors.js';
import { CSVImportEntitiesFactories } from '../factories/CSVImportEntitiesFactories.js';

const ParamsSchema = z.object({
  id: z.string(),
});

export class GetCsvImportEntitiesImportController extends AbstractController {
  protected async handle(): Promise<void> {
    const { id } = ParamsSchema.parse(this.request.params || {});
    const useCase = CSVImportEntitiesFactories.getCsvImportEntitiesImportUseCaseDefault();
    try {
      const response = await useCase.execute({ id });
      this.jsonResponse(response);
    } catch (error) {
      if (error instanceof CsvImportDoesNotExistError) {
        this.response.status(404).json({ message: error.message });
        return;
      }
      throw error;
    }
  }
}
