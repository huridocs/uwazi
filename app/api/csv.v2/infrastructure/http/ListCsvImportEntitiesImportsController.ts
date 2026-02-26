import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { CSVImportEntitiesFactories } from '../factories/CSVImportEntitiesFactories.js';

export class ListCsvImportEntitiesImportsController extends AbstractController {
  protected async handle(): Promise<void> {
    const useCase = CSVImportEntitiesFactories.listCsvImportEntitiesImportsUseCaseDefault();
    const response = await useCase.execute();
    this.jsonResponse(response);
  }
}
