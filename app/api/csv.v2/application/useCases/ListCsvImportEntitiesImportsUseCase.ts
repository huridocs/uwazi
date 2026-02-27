import { AbstractUseCase } from 'api/core/libs/UseCase';
import { CsvImportEntitiesImportsDataSource } from '../contracts/CsvImportEntitiesImportsDataSource';

type Deps = {
  csvImportEntitiesImportsDS: CsvImportEntitiesImportsDataSource;
};

type CsvImportEntitiesImportListRow = {
  id: string;
  status: string;
  templateId: string;
  file: {
    originalName: string;
    mimeType: string;
    size: number;
  };
  createdAt: number;
  updatedAt: number;
  progress?: {
    totalRows: number;
    processedRows: number;
    lastProcessedRow: number;
    batchSize: number;
  };
  stats?: {
    thesaurusValuesObserved?: number;
    thesaurusValuesCreated?: number;
    thesauriTouched?: number;
    relationshipValuesObserved?: number;
    relationshipValuesCreated?: number;
    entitiesCreated?: number;
    rowsProcessed?: number;
    rowsFailed?: number;
  };
  extraction?: {
    sourceType: 'zip' | 'csv';
    originalUploadSizeBytes: number;
    extractedFilesCount: number;
    totalFilesInZip?: number;
    files: Array<{
      filename: string;
      sizeBytes: number;
      compressedSizeBytes?: number;
    }>;
  };
  failure?: {
    message: string;
    retryable: boolean;
    at: number;
    stage: string;
    code?: string;
  };
};

type Output = {
  rows: CsvImportEntitiesImportListRow[];
};

class ListCsvImportEntitiesImportsUseCase extends AbstractUseCase<void, Output, Deps> {
  async execute(): Promise<Output> {
    const imports = await this.deps.csvImportEntitiesImportsDS.getAll();
    const rows = imports.map(csvImport => {
      const model = csvImport.toObject();
      return {
        id: model.id,
        status: model.status,
        templateId: model.templateId,
        file: model.file,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
        progress: model.progress,
        stats: model.stats,
        extraction: model.extraction,
        failure: model.failure
          ? {
              message: model.failure.message,
              retryable: model.failure.retryable,
              at: model.failure.at,
              stage: model.failure.stage,
              code: model.failure.code,
            }
          : undefined,
      };
    });

    return { rows };
  }
}

export { ListCsvImportEntitiesImportsUseCase };
export type { CsvImportEntitiesImportListRow, Output as ListCsvImportEntitiesImportsOutput };
