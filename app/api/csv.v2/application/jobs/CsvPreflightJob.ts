/* eslint-disable max-lines */
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { Template } from '#api/core/domain/template/Template.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { CsvImportRelationshipPendingValuesDataSource } from '../../application/contracts/CsvImportRelationshipPendingValuesDataSource.js';
import { CsvImportRelationshipPendingValues } from '../../domain/CsvImportRelationshipPendingValues.js';
import { CsvImportsDataSource } from '../../application/contracts/CsvImportsDataSource.js';
import { CsvImport, CsvImportDomain, CsvImportStatus } from '../../domain/CsvImport.js';
import {
  CsvHeaderAnalyzer,
  AnalyzerOptions,
  HeaderAnalysis,
} from '../services/CsvHeaderAnalyzer.js';
import { CsvHeaderAnalyzerError } from '../services/CsvHeaderAnalyzerError.js';
import { CsvThesauriPendingValuesBuilder } from '../services/CsvThesauriPendingValuesBuilder.js';
import { CsvImportRowsDataSource } from '../../application/contracts/CsvImportRowsDataSource.js';
import { CsvImportThesauriValuesDataSource } from '../contracts/CsvImportThesauriValuesDataSource.js';
import { Callbacks as BaseCallbacks } from './types/UseCaseCallbacks.js';
import { CsvCreateThesauriValuesJobHandler } from '../../infrastructure/jobHandlers/CsvCreateThesauriValuesJobHandler.js';
import { CsvThesauriPendingEntry } from '../../domain/CsvThesauriPendingValues.js';
import { CsvImportThesauriValues } from '../../domain/CsvImportThesauriValues.js';
import { CsvEntitiesImportMapper } from '../services/CsvEntitiesImportMapper.js';
import { collectRelationshipTitlesFromRows } from '../services/CsvPreflightRelationshipsService.js';
import { CsvImportRow } from '../../domain/CsvImportRow.js';

type ThesauriWritePort = {
  appendRootLabelsIfMissing(thesaurusId: string, labels: string[]): Promise<void>;
  appendNestedLabelsIfMissing(
    thesaurusId: string,
    entries: Array<{ parent: string; child?: string }>
  ): Promise<void>;
};

type Input = {
  importId: string;
  tenantName: string;
  userId: string;
  callbacks: Callbacks;
};

type Output = {
  importId: string;
  status: string;
};

type Deps = {
  csvImportsDS: CsvImportsDataSource;
  rowsDS: CsvImportRowsDataSource;
  templatesDS: TemplatesDataSource;
  settingsDS: SettingsDataSource;
  thesauriDS: ThesauriWritePort;
  thesauriValuesDS: CsvImportThesauriValuesDataSource;
  relationshipPendingValuesDS: CsvImportRelationshipPendingValuesDataSource;
  jobsDispatcher: JobsDispatcher;
};

type ScanProgress = {
  importId: string;
  processedRows: number;
  totalRows: number;
};

type Callbacks = BaseCallbacks & {
  onProgress: (info: ScanProgress) => void;
};

const DEFAULT_SCAN_BATCH_SIZE = 1000;

export class CsvPreflightJob extends AbstractUseCase<Input, Output, Deps> {
  private static groupPendingEntries(
    importId: string,
    entries: CsvThesauriPendingEntry[],
    createdAt: number
  ): CsvImportThesauriValues[] {
    const grouped = new Map<string, CsvThesauriPendingEntry[]>();
    entries.forEach(entry => {
      const list = grouped.get(entry.thesaurusId) || [];
      list.push(entry);
      grouped.set(entry.thesaurusId, list);
    });

    return Array.from(grouped.entries()).map(([thesaurusId, groupedEntries]) =>
      CsvImportThesauriValues.create({
        importId,
        thesaurusId,
        createdAt,
        entries: groupedEntries,
      })
    );
  }

  private async setStatus(importId: string, status: CsvImportStatus) {
    const csvImport = (await this.deps.csvImportsDS.getById(importId)).getDataOrThrow();
    const updated = CsvImportDomain.withStatus(csvImport, status);
    await this.deps.csvImportsDS.update(updated);
  }

  async markAsFailed(importId: string) {
    await this.setStatus(importId, CsvImportStatus.Failed);
  }

  private async getImport(importId: string) {
    const csvImport = (await this.deps.csvImportsDS.getById(importId)).getDataOrThrow();
    if (!csvImport.storage?.path) {
      throw new NonRetryableJobError(
        new Error(`CSV import storage path not found for import ${importId}`)
      );
    }
    if (!csvImport.templateId) {
      throw new NonRetryableJobError(
        new Error(`CSV import templateId not found for import ${importId}`)
      );
    }
    return csvImport;
  }

  private async getStagedRows(importId: string, callbacks: Callbacks) {
    const totalRows = await this.deps.rowsDS.countByImport(importId);
    if (!totalRows) {
      throw new NonRetryableJobError(new Error(`No staged rows found for import ${importId}`));
    }
    return this.collectStagedRows({ importId, totalRows, callbacks });
  }

  private async collectStagedRows(params: {
    importId: string;
    totalRows: number;
    callbacks: Callbacks;
  }) {
    const { importId, totalRows, callbacks } = params;
    const rows: CsvImportRow[] = [];
    let processedRows = 0;
    for (let offset = 0; offset < totalRows; offset += DEFAULT_SCAN_BATCH_SIZE) {
      // eslint-disable-next-line no-await-in-loop
      const batch = await this.deps.rowsDS.getByImport(importId, offset, DEFAULT_SCAN_BATCH_SIZE);
      if (!batch.length) {
        break;
      }
      processedRows = CsvPreflightJob.appendScanBatch({
        rows,
        batch,
        totalRows,
        importId,
        processedRows,
        callbacks,
        offset,
      });
    }
    return { rows, totalRows, processedRows };
  }

  private static appendScanBatch(params: {
    rows: CsvImportRow[];
    batch: CsvImportRow[];
    totalRows: number;
    importId: string;
    processedRows: number;
    callbacks: Callbacks;
    offset: number;
  }) {
    const { rows, batch, totalRows, importId, callbacks, offset } = params;
    rows.push(...batch);
    const processedRows = Math.min(totalRows, offset + batch.length);
    callbacks.onProgress({ importId, processedRows, totalRows });
    return processedRows;
  }

  private async getTemplate(templateId: string) {
    const templateRes = await this.deps.templatesDS.getById(templateId);
    if (templateRes.isError()) {
      throw new NonRetryableJobError(new Error(`template not found! ${templateId}`));
    }
    return templateRes.getData();
  }

  private async analyzeHeaders(
    csvImport: CsvImport,
    headers: string[],
    template: Template,
    options: AnalyzerOptions
  ): Promise<HeaderAnalysis> {
    try {
      return CsvHeaderAnalyzer.analyze(headers, template, options);
    } catch (error) {
      if (error instanceof CsvHeaderAnalyzerError) {
        await this.transactionManager.run(async () => {
          const failed = CsvImportDomain.withFailure(
            CsvImportDomain.withStatus(csvImport, CsvImportStatus.Failed),
            {
              message: 'Header validation failed',
              retryable: false,
              at: Date.now(),
              stage: 'preflight:preparation:headers',
              code: 'HEADER_VALIDATION_FAILED',
              issues: error.issues,
            }
          );
          await this.deps.csvImportsDS.update(failed);
        });
        throw new NonRetryableJobError(new Error('Header validation failed'));
      }
      throw error;
    }
  }

  private async persistGenericFailure(
    importId: string,
    passedCsvImport: CsvImport | undefined,
    error: Error
  ) {
    const csvImportRes = await this.deps.csvImportsDS.getById(importId);

    if (!passedCsvImport && csvImportRes.isError()) {
      return;
    }

    const csvImport = (passedCsvImport || csvImportRes.getData())!;

    await this.transactionManager.run(async () => {
      const withFailure = CsvImportDomain.withFailure(csvImport, {
        message: error.message,
        retryable: !(error instanceof NonRetryableJobError),
        at: Date.now(),
        stage: 'preflight:scan',
      });
      const withStatus = CsvImportDomain.withStatus(
        withFailure,
        error instanceof NonRetryableJobError ? CsvImportStatus.Failed : CsvImportStatus.Retrying
      );
      await this.deps.csvImportsDS.update(withStatus);
    });
  }

  // eslint-disable-next-line max-statements
  async execute(input: Input): Promise<Output> {
    const { importId, callbacks, tenantName, userId } = input;

    callbacks.onStart({ importId });
    await this.setStatus(importId, CsvImportStatus.PreflightScan);

    let csvImport: CsvImport | undefined;
    let failureRecorded = false;

    try {
      csvImport = await this.getImport(importId);
      const { rows: stagedRows } = await this.getStagedRows(importId, callbacks);
      const template = await this.getTemplate(csvImport.templateId);
      const [availableLanguages, defaultLanguage, settings] = await Promise.all([
        this.deps.settingsDS.getLanguageKeys(),
        this.deps.settingsDS.getDefaultLanguageKey(),
        this.deps.settingsDS.get(),
      ]);
      const newNameGeneration = Boolean(settings?.newNameGeneration);

      const { headers } = stagedRows[0];
      const headerAnalysis = await this.analyzeHeaders(csvImport, headers, template, {
        availableLanguages,
        defaultLanguage,
        newNameGeneration,
      });
      const sanitizedHeaders = CsvEntitiesImportMapper.sanitizeHeaders(headers, newNameGeneration);

      const { pendingValues, issues: pendingIssues } = CsvThesauriPendingValuesBuilder.build({
        importId,
        rows: stagedRows,
        template,
        headerAnalysis,
        defaultLanguage,
        newNameGeneration,
      });

      const titlesByTemplate = collectRelationshipTitlesFromRows({
        rows: stagedRows,
        template,
        sanitizedHeaders,
      });

      if (pendingIssues.length) {
        await this.transactionManager.run(async () => {
          const failed = CsvImportDomain.withFailure(
            CsvImportDomain.withStatus(csvImport!, CsvImportStatus.Failed),
            {
              message: 'Thesauri values contain errors',
              retryable: false,
              at: Date.now(),
              stage: 'preflight:preparation:thesauri',
              code: 'THESAURI_VALUES_INVALID',
              issues: pendingIssues.map(issue => ({
                reason: issue.reason,
                message: issue.reason,
                property: issue.property,
              })),
            }
          );
          await this.deps.csvImportsDS.update(failed);
        });
        failureRecorded = true;
        throw new NonRetryableJobError(new Error('Thesauri values contain errors'));
      }

      const groupedPendingValues = CsvPreflightJob.groupPendingEntries(
        importId,
        pendingValues.entries,
        pendingValues.createdAt
      );
      await this.deps.thesauriValuesDS.replacePendingValues(importId, groupedPendingValues);

      const relationshipPendingDocs = Array.from(titlesByTemplate.entries()).map(
        ([templateId, titles]) =>
          CsvImportRelationshipPendingValues.create({
            importId,
            templateId,
            titles: Array.from(titles),
            createdAt: pendingValues.createdAt,
          })
      );
      await this.deps.relationshipPendingValuesDS.replacePendingValues(
        importId,
        relationshipPendingDocs
      );

      await this.transactionManager.run(async () => {
        const clearedFailure = CsvImportDomain.clearFailure(csvImport!);
        const updated = CsvImportDomain.withStatus(
          clearedFailure,
          CsvImportStatus.PreflightScanDone
        );
        await this.deps.csvImportsDS.update(updated);
        await this.jobsDispatcher.dispatch(CsvCreateThesauriValuesJobHandler, {
          tenantName,
          userId,
          importId,
        });
      });

      callbacks.onSuccess({ importId });
      return { importId, status: CsvImportStatus.PreflightScanDone };
    } catch (error) {
      if (!failureRecorded) {
        await this.persistGenericFailure(importId, csvImport, error as Error);
      }
      callbacks.onError({ importId, error: error as Error });
      throw error;
    }
  }
}

export {};
