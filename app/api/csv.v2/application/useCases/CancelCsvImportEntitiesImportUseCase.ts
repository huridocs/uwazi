import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { CsvImportStatus } from '../../domain/CsvImport.js';
import { CsvImportEntitiesImportsDataSource } from '../contracts/CsvImportEntitiesImportsDataSource.js';

type Deps = {
  csvImportEntitiesImportsDS: CsvImportEntitiesImportsDataSource;
};

type Input = {
  id: string;
};

type Output = {
  id: string;
  status: string;
  cancelled: boolean;
};

const TERMINAL_STATUSES = new Set<string>([
  CsvImportStatus.Cancelled,
  CsvImportStatus.Completed,
  CsvImportStatus.ImportEntitiesDone,
  CsvImportStatus.Failed,
]);

class CancelCsvImportEntitiesImportUseCase extends AbstractUseCase<Input, Output, Deps> {
  constructor(deps: Deps) {
    super(deps);
  }

  async execute(input: Input): Promise<Output> {
    const csvImport = (
      await this.deps.csvImportEntitiesImportsDS.getById(input.id)
    ).getDataOrThrow();

    if (csvImport.status === CsvImportStatus.Cancelled) {
      return { id: csvImport.id, status: csvImport.status, cancelled: true };
    }

    if (TERMINAL_STATUSES.has(csvImport.status)) {
      return { id: csvImport.id, status: csvImport.status, cancelled: false };
    }

    await this.deps.csvImportEntitiesImportsDS.cancel(input.id);
    const refreshed = (
      await this.deps.csvImportEntitiesImportsDS.getById(input.id)
    ).getDataOrThrow();

    return {
      id: refreshed.id,
      status: refreshed.status,
      cancelled: refreshed.status === CsvImportStatus.Cancelled,
    };
  }
}

export { CancelCsvImportEntitiesImportUseCase };
