import { AbstractUseCase } from 'api/core/libs/UseCase';
import { CsvImportEntitiesImportsDataSource } from '../contracts/CsvImportEntitiesImportsDataSource';

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
