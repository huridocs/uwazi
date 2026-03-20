import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FilesService } from '#api/core/application/FilesService.js';
import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { CsvHeaderAnalyzer, AnalyzerOptions } from '../services/CsvHeaderAnalyzer.js';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource.js';
import { CsvImportRowsDataSource } from '../contracts/CsvImportRowsDataSource.js';
import { CsvImportRowErrorsDataSource } from '../contracts/CsvImportRowErrorsDataSource.js';
import { CsvImportThesauriValuesDataSource } from '../contracts/CsvImportThesauriValuesDataSource.js';
import {
  CsvImportDomain,
  CsvImportStatus,
  CsvImportStats,
  CsvImport,
} from '../../domain/CsvImport.js';
import { CsvEntitiesImportMapper } from '../services/CsvEntitiesImportMapper.js';
import { persistRowErrorsReport } from '../services/CsvImportEntitiesErrorReporting.js';
import { processImportRows } from './CsvImportEntitiesRowsProcessor.js';
import { Callbacks, ImportContext } from './CsvImportEntitiesTypes.js';
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
  entitiesDS: MultiLanguageEntityDataSource;
  mapper: CsvEntitiesImportMapper;
  transactionManager: TransactionManager;
  fileStorage: FileStorage;
  filesService: FilesService;
  propertyAssignmentCreatorServiceStrategy: PropertyAssignmentCreatorServiceStrategy;
  idGenerator: IdGenerator;
  jobsDispatcher: JobsDispatcher;
  batchSize?: number;
};

const DEFAULT_BATCH_SIZE = 1000;
const CSV_IMPORT_ROW_FAILURE_WARMUP_ROWS = 50;
const CSV_IMPORT_ROW_FAILURE_RATIO_STOP = 0.6;
const CSV_IMPORT_ROW_FAILURE_CONSECUTIVE_STOP = 25;
const CSV_IMPORT_ROW_FAILURE_ABSOLUTE_STOP = 500;

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

  private async loadContext(importId: string): Promise<ImportContext> {
    const csvImport = (await this.deps.csvImportsDS.getById(importId)).getDataOrThrow();
    const template = (await this.deps.templatesDS.getById(csvImport.templateId)).getDataOrThrow();
    const [
      availableLanguages,
      defaultLanguage,
      settings,
      totalRows,
      firstRow,
      thesaurusIndex,
      relationshipIndex,
    ] = await Promise.all([
      this.deps.settingsDS.getLanguageKeys(),
      this.deps.settingsDS.getDefaultLanguageKey(),
      this.deps.settingsDS.get(),
      this.deps.rowsDS.countByImport(importId),
      this.deps.rowsDS.getByImport(importId, 0, 1),
      this.deps.mapper.buildAppliedValuesIndex(importId),
      this.deps.mapper.buildRelationshipValuesIndex(importId),
    ]);

    if (!totalRows || !firstRow.length) {
      throw new NonRetryableJobError(new Error(`No staged rows found for import ${importId}`));
    }
    const analyzerOptions: AnalyzerOptions = {
      availableLanguages,
      defaultLanguage,
      newNameGeneration: Boolean(settings?.newNameGeneration),
    };

    const sanitizedHeaders = CsvEntitiesImportMapper.sanitizeHeaders(
      firstRow[0].headers,
      analyzerOptions.newNameGeneration
    );
    const headerAnalysis = CsvHeaderAnalyzer.analyze(
      firstRow[0].headers,
      template,
      analyzerOptions
    );
    return {
      csvImport,
      template,
      languages: availableLanguages.map((lang: string): LanguageISO6391 => lang as LanguageISO6391),
      defaultLanguage: defaultLanguage as LanguageISO6391,
      dateFormat: settings?.dateFormat,
      totalRows,
      thesaurusIndex,
      relationshipIndex,
      sanitizedHeaders,
      headerAnalysis,
    };
  }

  private async finalizeSuccess(
    csvImport: CsvImport,
    entitiesCreated: number,
    processedRows: number,
    failedRows: number,
    importId: string,
    tenantName: string,
    userId: string
  ) {
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
    const context = await this.loadContext(importId);
    const { entitiesCreated, csvImport, processedRows, shouldStop, stopReason, cancelled } =
      await processImportRows({
        context,
        callbacks,
        deps: {
          rowsDS: this.deps.rowsDS,
          rowErrorsDS: this.deps.rowErrorsDS,
          csvImportsDS: this.deps.csvImportsDS,
          entitiesDS: this.deps.entitiesDS,
          transactionManager: this.transactionManager,
          propertyAssignmentCreatorServiceStrategy:
            this.deps.propertyAssignmentCreatorServiceStrategy,
          filesService: this.deps.filesService,
          fileStorage: this.deps.fileStorage,
          idGenerator: this.deps.idGenerator,
        },
        batchSize: this.getBatchSize(),
        failurePolicy: {
          warmupRows: CSV_IMPORT_ROW_FAILURE_WARMUP_ROWS,
          failureRatioStop: CSV_IMPORT_ROW_FAILURE_RATIO_STOP,
          consecutiveStop: CSV_IMPORT_ROW_FAILURE_CONSECUTIVE_STOP,
          absoluteStop: CSV_IMPORT_ROW_FAILURE_ABSOLUTE_STOP,
        },
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
    await this.finalizeSuccess(
      csvImport,
      entitiesCreated,
      processedRows,
      report.failedRows,
      importId,
      tenantName,
      userId ?? csvImport.createdBy
    );
  }

  async execute(input: Input): Promise<void> {
    const { importId, callbacks } = input;
    if (await this.deps.csvImportsDS.isCancelled(importId)) {
      return;
    }

    callbacks.onStart({ importId });
    await this.setStatus(importId, CsvImportStatus.ImportEntities);

    try {
      const tenantName = input.tenantName ?? tenants.current().name;
      const userId = input.userId;
      await this.runImport(importId, callbacks, tenantName, userId);
      if (await this.deps.csvImportsDS.isCancelled(importId)) {
        return;
      }
      callbacks.onSuccess({ importId });
    } catch (error) {
      await this.persistFailure(importId, error as Error);
      callbacks.onError({ importId, error: error as Error });
      throw error;
    }
  }
}

export { CsvImportEntitiesJob };
