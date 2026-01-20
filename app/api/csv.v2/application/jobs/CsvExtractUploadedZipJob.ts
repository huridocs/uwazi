import path from 'path';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { CsvImportsDataSource } from '#api/csv.v2/application/contracts/CsvImportsDataSource.js';
import { CsvImportRowsDataSource } from '#api/csv.v2/application/contracts/CsvImportRowsDataSource.js';
import { CsvImportDomain, CsvImportStatus } from '#api/csv.v2/domain/CsvImport.js';
import { CsvImportRow } from '#api/csv.v2/domain/CsvImportRow.js';
import { CsvImportFileNormalizer } from '#api/csv.v2/application/services/CsvImportFileNormalizer.js';
import { CsvImportRowsStager } from '#api/csv.v2/application/services/CsvImportRowsStager.js';
import { CsvPreflightJobHandler } from '#api/csv.v2/infrastructure/jobHandlers/CsvPreflightJobHandler.js';
import { Callbacks as BaseCallbacks } from '#api/csv.v2/application/jobs/types/UseCaseCallbacks.js';

type Deps = {
  csvImportsDS: CsvImportsDataSource;
  fileNormalizer: CsvImportFileNormalizer;
  rowsStager: CsvImportRowsStager;
  rowsDS: CsvImportRowsDataSource;
  transactionManager: TransactionManager;
  jobsDispatcher: JobsDispatcher;
};

type ExtractionProgress =
  | { type: 'files'; importId: string; processedFiles: number }
  | { type: 'rows'; importId: string; stagedRows: number };

type Callbacks = BaseCallbacks & {
  onProgress: (info: ExtractionProgress) => void;
};

type Input = {
  importId: string;
  tenantName: string;
  userId: string;
  callbacks: Callbacks;
};

class CsvExtractUploadedZipJob extends AbstractUseCase<Input, void, Deps> {
  private static parseStoragePath(storagePath: string) {
    const filename = path.basename(storagePath);
    const destination = path.dirname(storagePath);
    return { filename, destination };
  }

  private static emitStart(callbacks: Callbacks, importId: string) {
    callbacks.onStart({ importId });
  }

  private static emitSuccess(callbacks: Callbacks, importId: string) {
    callbacks.onSuccess({ importId });
  }

  private static emitError(callbacks: Callbacks, importId: string, error: Error) {
    callbacks.onError({ importId, error });
  }

  private async setStatus(importId: string, status: CsvImportStatus) {
    const csvImport = (await this.deps.csvImportsDS.getById(importId)).getDataOrThrow();
    const updated = CsvImportDomain.withStatus(csvImport, status);
    await this.deps.csvImportsDS.update(updated);
  }

  private async getImportStoragePath(importId: string) {
    const csvImport = (await this.deps.csvImportsDS.getById(importId)).getDataOrThrow();
    if (!csvImport.storage?.path) {
      throw new NonRetryableJobError(new Error('CSV import storage path not found'));
    }
    return csvImport.storage.path;
  }

  async markAsFailed(importId: string) {
    await this.setStatus(importId, CsvImportStatus.Failed);
  }

  private async dispatchPreflight(importId: string, tenantName: string, userId: string) {
    await this.deps.jobsDispatcher.dispatch(CsvPreflightJobHandler, {
      tenantName,
      userId,
      importId,
    });
  }

  async handleExtractionSuccess(importId: string, context: { tenantName: string; userId: string }) {
    // success: clear any prior failure and mark files extracted
    const csvImport = (await this.deps.csvImportsDS.getById(importId)).getDataOrThrow();
    await this.transactionManager.run(async () => {
      const cleared = CsvImportDomain.clearFailure(csvImport);
      const updated = CsvImportDomain.withStatus(cleared, CsvImportStatus.ExtractingFilesDone);
      await this.deps.csvImportsDS.update(updated);
      await this.dispatchPreflight(importId, context.tenantName, context.userId);
    });
  }

  async handleError(importId: string, callbacks: Callbacks, error: Error) {
    CsvExtractUploadedZipJob.emitError(callbacks, importId, error);
    const csvImport = (await this.deps.csvImportsDS.getById(importId)).getDataOrThrow();
    const failure = {
      message: error.message,
      retryable: !(error instanceof NonRetryableJobError),
      at: Date.now(),
      stage: 'extracting files',
    };
    await this.transactionManager.run(async () => {
      const withFailure = CsvImportDomain.withFailure(csvImport, failure);
      const withStatus = CsvImportDomain.withStatus(
        withFailure,
        error instanceof NonRetryableJobError ? CsvImportStatus.Failed : CsvImportStatus.Retrying
      );
      await this.deps.csvImportsDS.update(withStatus);
    });
  }

  private async deleteExistingRows(importId: string) {
    await this.transactionManager.run(async () => {
      await this.deps.rowsDS.deleteByImport(importId);
    });
  }

  private async insertRowsBatch(rows: CsvImportRow[]) {
    if (!rows.length) {
      return;
    }
    await this.transactionManager.run(async () => {
      await this.deps.rowsDS.insertMany(rows);
    });
  }

  private async stageRows(importId: string, destination: string, callbacks: Callbacks) {
    await this.deps.rowsStager.stage({
      importId,
      destination,
      onRowProgress: info => callbacks.onProgress({ type: 'rows', ...info }),
      deleteRows: async () => this.deleteExistingRows(importId),
      insertBatch: async rows => this.insertRowsBatch(rows),
    });
  }

  private async processExtraction(params: {
    importId: string;
    destination: string;
    filename: string;
    callbacks: Callbacks;
    tenantName: string;
    userId: string;
  }) {
    try {
      await this.deps.fileNormalizer.normalize({
        importId: params.importId,
        destination: params.destination,
        filename: params.filename,
        onFileProgress: info =>
          params.callbacks.onProgress({
            type: 'files',
            importId: info.importId,
            processedFiles: info.processedFiles,
          }),
      });
      await this.stageRows(params.importId, params.destination, params.callbacks);
      await this.handleExtractionSuccess(params.importId, {
        tenantName: params.tenantName,
        userId: params.userId,
      });
      CsvExtractUploadedZipJob.emitSuccess(params.callbacks, params.importId);
    } catch (e) {
      await this.handleError(params.importId, params.callbacks, e as Error);
      throw e;
    }
  }

  async execute(input: Input): Promise<void> {
    const { importId, callbacks, tenantName, userId } = input;

    CsvExtractUploadedZipJob.emitStart(callbacks, importId);
    await this.setStatus(importId, CsvImportStatus.ExtractingFiles);

    const storagePath = await this.getImportStoragePath(importId);

    const { filename, destination } = CsvExtractUploadedZipJob.parseStoragePath(storagePath);

    await this.processExtraction({
      importId,
      destination,
      filename,
      callbacks,
      tenantName,
      userId,
    });
  }
}

export { CsvExtractUploadedZipJob };
export type { Callbacks, ExtractionProgress };
