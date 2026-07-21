import path from 'path';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { CsvImportsDataSource } from '../../application/contracts/CsvImportsDataSource.js';
import { CsvImportRowsDataSource } from '../../application/contracts/CsvImportRowsDataSource.js';
import { CsvImportDomain, CsvImportStatus } from '../../domain/CsvImport.js';
import { CsvImportRow } from '../../domain/CsvImportRow.js';
import {
  CsvImportFileNormalizer,
  NormalizeResult as FileNormalizeResult,
} from '../services/CsvImportFileNormalizer.js';
import { CsvImportRowsStager } from '../services/CsvImportRowsStager.js';
import { CsvPreflightJobHandler } from '../../infrastructure/jobHandlers/CsvPreflightJobHandler.js';
import { Callbacks as BaseCallbacks } from './types/UseCaseCallbacks.js';
import { CsvCleanupAwareJob } from './CsvCleanupAwareJob.js';

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

class CsvExtractUploadedZipJob extends CsvCleanupAwareJob<Input, void, Deps> {
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

  private async isCancelled(importId: string) {
    return this.deps.csvImportsDS.isCancelled(importId);
  }

  private async dispatchPreflight(importId: string, tenantName: string, userId: string) {
    await this.deps.jobsDispatcher.dispatch(CsvPreflightJobHandler, {
      tenantName,
      userId,
      importId,
    });
  }

  private static toExtractionMetadata(
    csvImport: CsvImportDomain,
    normalizeResult: FileNormalizeResult
  ) {
    if (normalizeResult.sourceType === 'csv') {
      return {
        sourceType: 'csv' as const,
        originalUploadSizeBytes: csvImport.file.size,
        extractedFilesCount: 1,
        files: [
          {
            filename: csvImport.file.originalName,
            sizeBytes: csvImport.file.size,
          },
        ],
      };
    }

    return {
      sourceType: 'zip' as const,
      originalUploadSizeBytes: csvImport.file.size,
      extractedFilesCount: normalizeResult.extractedFilesCount,
      totalFilesInZip: normalizeResult.totalFilesInZip,
      files: normalizeResult.files,
    };
  }

  async handleExtractionSuccess(
    importId: string,
    context: { tenantName: string; userId: string },
    normalizeResult: FileNormalizeResult
  ) {
    // success: clear any prior failure and mark files extracted
    const csvImport = (await this.deps.csvImportsDS.getById(importId)).getDataOrThrow();
    const extraction = CsvExtractUploadedZipJob.toExtractionMetadata(csvImport, normalizeResult);
    await this.transactionManager.run(async () => {
      const cleared = CsvImportDomain.clearFailure(csvImport);
      const withExtraction = CsvImportDomain.withExtraction(cleared, extraction);
      const updated = CsvImportDomain.withStatus(
        withExtraction,
        CsvImportStatus.ExtractingFilesDone
      );
      await this.deps.csvImportsDS.update(updated);
      if (await this.deps.csvImportsDS.isCancelled(importId)) {
        return;
      }
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
      const withCleanup = this.withCleanupPendingIfFailed(withStatus, withStatus.status);
      await this.deps.csvImportsDS.update(withCleanup);
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
    if (await this.isCancelled(rows[0].importId)) {
      return;
    }
    await this.transactionManager.run(async () => {
      await this.deps.rowsDS.insertMany(rows);
    });
  }

  private async stageRows(importId: string, destination: string, callbacks: Callbacks) {
    if (await this.isCancelled(importId)) {
      return;
    }
    await this.deps.rowsStager.stage({
      importId,
      destination,
      onRowProgress: info => callbacks.onProgress({ type: 'rows', ...info }),
      deleteRows: async () => this.deleteExistingRows(importId),
      insertBatch: async rows => this.insertRowsBatch(rows),
      shouldContinue: async () => !(await this.isCancelled(importId)),
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
      if (await this.isCancelled(params.importId)) {
        return;
      }
      const normalizeResult = await this.deps.fileNormalizer.normalize({
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
      if (await this.isCancelled(params.importId)) {
        return;
      }
      await this.stageRows(params.importId, params.destination, params.callbacks);
      await this.handleExtractionSuccess(
        params.importId,
        {
          tenantName: params.tenantName,
          userId: params.userId,
        },
        normalizeResult
      );
      if (await this.isCancelled(params.importId)) {
        return;
      }
      CsvExtractUploadedZipJob.emitSuccess(params.callbacks, params.importId);
    } catch (e) {
      await this.handleError(params.importId, params.callbacks, e as Error);
      throw e;
    }
  }

  async execute(input: Input): Promise<void> {
    const { importId, callbacks, tenantName, userId } = input;
    if (await this.isCancelled(importId)) {
      return;
    }

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
