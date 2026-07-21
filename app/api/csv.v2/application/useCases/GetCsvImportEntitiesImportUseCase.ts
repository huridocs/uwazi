import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { CsvImportEntitiesImportsDataSource } from '../contracts/CsvImportEntitiesImportsDataSource.js';
import { CsvImportRowErrorsDataSource } from '../contracts/CsvImportRowErrorsDataSource.js';

type Deps = {
  csvImportEntitiesImportsDS: CsvImportEntitiesImportsDataSource;
  rowErrorsDS: CsvImportRowErrorsDataSource;
};

type Input = {
  id: string;
};

class GetCsvImportEntitiesImportUseCase extends AbstractUseCase<Input, Record<string, any>, Deps> {
  async execute(input: Input): Promise<Record<string, any>> {
    const csvImport = (
      await this.deps.csvImportEntitiesImportsDS.getById(input.id)
    ).getDataOrThrow();
    const rowErrors = await this.deps.rowErrorsDS.getByImport(input.id);
    const importObject = csvImport.toObject();
    return {
      ...importObject,
      rowErrorsSummary: importObject.rowErrors,
      rowErrors: rowErrors.map(error => error.toObject()),
    };
  }
}

export { GetCsvImportEntitiesImportUseCase };
