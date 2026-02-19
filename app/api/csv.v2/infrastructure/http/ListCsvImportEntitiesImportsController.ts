import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import { CSVImportEntitiesFactories } from '../factories/CSVImportEntitiesFactories';

export class ListCsvImportEntitiesImportsController extends AbstractController {
  protected async handle(): Promise<void> {
    const useCase = CSVImportEntitiesFactories.listCsvImportEntitiesImportsUseCaseDefault();
    const response = await useCase.execute();
    this.jsonResponse(response);
  }
}
