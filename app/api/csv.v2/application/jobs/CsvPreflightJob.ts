/* eslint-disable max-lines */
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { Template } from '#api/core/domain/template/Template.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
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
import { Callbacks } from './types/UseCaseCallbacks.js';
import { CsvCreateThesauriValuesJobHandler } from '../../infrastructure/jobHandlers/CsvCreateThesauriValuesJobHandler.js';
import { CsvThesauriPendingEntry } from '../../domain/CsvThesauriPendingValues.js';
import { CsvImportThesauriValues } from '../../domain/CsvImportThesauriValues.js';

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
  jobsDispatcher: JobsDispatcher;
};

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

  private async getStagedRows(importId: string) {
    const rows = await this.deps.rowsDS.getByImport(importId);
    if (!rows.length) {
      throw new NonRetryableJobError(new Error(`No staged rows found for import ${importId}`));
    }
    return rows;
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
        stage: 'preflight:thesauri',
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
    await this.setStatus(importId, CsvImportStatus.PreflightThesauri);

    let csvImport: CsvImport | undefined;
    let failureRecorded = false;

    try {
      csvImport = await this.getImport(importId);
      const stagedRows = await this.getStagedRows(importId);
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

      const { pendingValues, issues: pendingIssues } = CsvThesauriPendingValuesBuilder.build({
        importId,
        rows: stagedRows,
        template,
        headerAnalysis,
        defaultLanguage,
        newNameGeneration,
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

      await this.transactionManager.run(async () => {
        const clearedFailure = CsvImportDomain.clearFailure(csvImport!);
        const updated = CsvImportDomain.withStatus(
          clearedFailure,
          CsvImportStatus.PreflightThesauriDone
        );
        await this.deps.csvImportsDS.update(updated);
        await this.jobsDispatcher.dispatch(CsvCreateThesauriValuesJobHandler, {
          tenantName,
          userId,
          importId,
        });
      });

      callbacks.onSuccess({ importId });
      return { importId, status: CsvImportStatus.PreflightThesauriDone };
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
