import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { CsvImportEntitiesImportsDataSource } from '../contracts/CsvImportEntitiesImportsDataSource.js';

type Deps = {
  csvImportEntitiesImportsDS: CsvImportEntitiesImportsDataSource;
};

type Input = {
  id: string;
};

class GetCsvImportEntitiesImportUseCase extends AbstractUseCase<Input, Record<string, any>, Deps> {
  async execute(input: Input): Promise<Record<string, any>> {
    const csvImport = (
      await this.deps.csvImportEntitiesImportsDS.getById(input.id)
    ).getDataOrThrow();
    return csvImport.toObject();
  }
}

export { GetCsvImportEntitiesImportUseCase };
