import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { EntitiesService } from '#api/core/application/EntitiesService.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FilesService } from '#api/core/application/FilesService.js';
import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource.js';
import { CsvImportRowsDataSource } from '../contracts/CsvImportRowsDataSource.js';
import { CsvImportRowErrorsDataSource } from '../contracts/CsvImportRowErrorsDataSource.js';
import { CsvImportThesauriValuesDataSource } from '../contracts/CsvImportThesauriValuesDataSource.js';
import { CsvImportDomain, CsvImportStatus, CsvImportStats } from '../../domain/CsvImport.js';
import { CsvEntitiesImportMapper } from '../services/CsvEntitiesImportMapper.js';
import { persistRowErrorsReport } from '../services/CsvImportEntitiesErrorReporting.js';
import { processImportRows } from './CsvImportEntitiesRowsProcessor.js';
import { CSV_IMPORT_FAILURE_POLICY } from './CsvImportEntitiesFailurePolicy.js';
import { loadCsvImportEntitiesContext } from './CsvImportEntitiesContextLoader.js';
import { Callbacks } from './CsvImportEntitiesTypes.js';
import { CsvCleanupAwareJob } from './CsvCleanupAwareJob.js';

type Input = {
  importId: string;
  tenantName?: string;
  userId?: string;
  callbacks: Callbacks;
};
type Deps = {
  csvImportsDS: CsvImportsDataSource;
  rowsDS: CsvImportRowsDataSource;
  rowErrorsDS: CsvImportRowErrorsDataSource;
  thesauriValuesDS: CsvImportThesauriValuesDataSource;
  templatesDS: TemplatesDataSource;
  settingsDS: SettingsDataSource;
  entitiesService: EntitiesService;
  mapper: CsvEntitiesImportMapper;
  transactionManager: TransactionManager;
  fileStorage: FileStorage;
  filesService: FilesService;
  propertyAssignmentCreatorServiceStrategy: PropertyAssignmentCreatorServiceStrategy;
  idGenerator: IdGenerator;
  jobsDispatcher: JobsDispatcher;
  batchSize?: number;
};

const DEFAULT_BATCH_SIZE = 10;

type FinalizeSuccessInput = {
  entitiesCreated: number;
  processedRows: number;
  failedRows: number;
  importId: string;
  tenantName: string;
  userId: string;
};

class CsvImportEntitiesJob extends CsvCleanupAwareJob<Input, void, Deps> {
  private getBatchSize() {
    return Math.max(1, this.deps.batchSize ?? DEFAULT_BATCH_SIZE);
  }

  private async setStatus(importId: string, status: CsvImportStatus) {
    const csvImport = (await this.deps.csvImportsDS.getById(importId)).getDataOrThrow();
    await this.transactionManager.run(async () => {
      const updated = CsvImportDomain.withStatus(csvImport, status);
      await this.deps.csvImportsDS.update(updated);
    });
  }

  private async persistFailure(importId: string, error: Error) {
    const csvImportRes = await this.deps.csvImportsDS.getById(importId);
    if (csvImportRes.isError()) {
      return;
    }

    const csvImport = csvImportRes.getData();

    await this.transactionManager.run(async () => {
      const withFailure = CsvImportDomain.withFailure(csvImport, {
        message: error.message,
        retryable: !(error instanceof NonRetryableJobError),
        at: Date.now(),
        stage: 'import:entities',
      });
      const withStatus = CsvImportDomain.withStatus(
        withFailure,
        error instanceof NonRetryableJobError ? CsvImportStatus.Failed : CsvImportStatus.Retrying
      );
      const withCleanup = this.withCleanupPendingIfFailed(withStatus, withStatus.status);
      await this.deps.csvImportsDS.update(withCleanup);
    });
  }

  private async finalizeSuccess(input: FinalizeSuccessInput) {
    const { entitiesCreated, processedRows, failedRows, importId, tenantName, userId } = input;
    const csvImport = (await this.deps.csvImportsDS.getById(importId)).getDataOrThrow();
    await this.transactionManager.run(async () => {
      const updatedStats: CsvImportStats = {
        ...(csvImport.stats || {}),
        entitiesCreated: (csvImport.stats?.entitiesCreated || 0) + entitiesCreated,
        rowsProcessed: processedRows,
        rowsFailed: failedRows,
      };
      const cleared = CsvImportDomain.clearFailure(csvImport);
      const withStatus = CsvImportDomain.withStatus(cleared, CsvImportStatus.ImportEntitiesDone);
      const withStats = withStatus.withStats(updatedStats);
      const withFilesCleanup = CsvImportDomain.withFilesCleanup(withStats, 'pending');
      await this.deps.csvImportsDS.update(withFilesCleanup);
      await this.dispatchFilesCleanup(importId, tenantName, userId);
    });
  }

  private async runImport(
    importId: string,
    callbacks: Callbacks,
    tenantName: string,
    userId?: string
  ) {
    const context = await loadCsvImportEntitiesContext(
      {
        csvImportsDS: this.deps.csvImportsDS,
        rowsDS: this.deps.rowsDS,
        templatesDS: this.deps.templatesDS,
        settingsDS: this.deps.settingsDS,
        mapper: this.deps.mapper,
      },
      importId
    );
    const actorId = userId ?? context.csvImport.createdBy;
    const { entitiesCreated, processedRows, shouldStop, stopReason, cancelled } =
      await processImportRows({
        context,
        callbacks,
        deps: {
          rowsDS: this.deps.rowsDS,
          rowErrorsDS: this.deps.rowErrorsDS,
          csvImportsDS: this.deps.csvImportsDS,
          entitiesService: this.deps.entitiesService,
          transactionManager: this.transactionManager,
          propertyAssignmentCreatorServiceStrategy:
            this.deps.propertyAssignmentCreatorServiceStrategy,
          filesService: this.deps.filesService,
          fileStorage: this.deps.fileStorage,
          idGenerator: this.deps.idGenerator,
        },
        tenantName,
        actorId,
        batchSize: this.getBatchSize(),
        failurePolicy: CSV_IMPORT_FAILURE_POLICY,
      });
    const report = await persistRowErrorsReport({
      importId,
      totalRows: processedRows,
      rowErrorsDS: this.deps.rowErrorsDS,
      rowsDS: this.deps.rowsDS,
      csvImportsDS: this.deps.csvImportsDS,
      transactionManager: this.transactionManager,
      fileStorage: this.deps.fileStorage,
    });
    if (cancelled || (await this.deps.csvImportsDS.isCancelled(importId))) {
      return;
    }
    if (shouldStop) {
      throw new NonRetryableJobError(new Error(stopReason || 'Stopped due to failure policy'));
    }
    await this.finalizeSuccess({
      entitiesCreated,
      processedRows,
      failedRows: report.failedRows,
      importId,
      tenantName,
      userId: actorId,
    });
  }

  private async emitSuccessIfNotCancelled(importId: string, callbacks: Callbacks) {
    if (await this.deps.csvImportsDS.isCancelled(importId)) {
      return;
    }
    callbacks.onSuccess({ importId });
  }

  private async handleRunImportError(importId: string, callbacks: Callbacks, error: unknown) {
    const importError = error as Error;
    await this.persistFailure(importId, importError);
    callbacks.onError({ importId, error: importError });
    throw importError;
  }

  private async beginExecution(input: Input) {
    const { importId, callbacks } = input;
    callbacks.onStart({ importId });
    await this.setStatus(importId, CsvImportStatus.ImportEntities);
  }

  private async runImportWithErrorHandling(input: Input) {
    const { importId, callbacks, userId } = input;
    const tenantName = input.tenantName ?? tenants.current().name;
    try {
      await this.runImport(importId, callbacks, tenantName, userId);
      await this.emitSuccessIfNotCancelled(importId, callbacks);
    } catch (error) {
      await this.handleRunImportError(importId, callbacks, error);
    }
  }

  async execute(input: Input): Promise<void> {
    const { importId } = input;
    if (await this.deps.csvImportsDS.isCancelled(importId)) {
      return;
    }
    await this.beginExecution(input);
    await this.runImportWithErrorHandling(input);
  }
}

export { CsvImportEntitiesJob };
