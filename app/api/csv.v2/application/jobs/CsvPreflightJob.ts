import { AbstractUseCase } from 'api/core/libs/UseCase';
import { TemplatesDataSource } from 'api/core/application/contracts/TemplatesDataSource';
import { SettingsDataSource } from 'api/core/application/contracts/SettingsDataSource';
import { NonRetryableJobError } from 'api/core/libs/queue/infrastructure/errors';
import { Template } from 'api/core/domain/template/Template';
import { CsvImportsDataSource } from '../../application/contracts/CsvImportsDataSource';
import { CsvImport, CsvImportDomain, CsvImportStatus } from '../../domain/CsvImport';
import { CsvHeaderAnalyzer, AnalyzerOptions, HeaderAnalysis } from '../services/CsvHeaderAnalyzer';
import { CsvHeaderAnalyzerError } from '../services/CsvHeaderAnalyzerError';
import { CsvThesauriValuesBuilder } from '../services/CsvThesauriValuesBuilder';
import { CsvImportRowsDataSource } from '../../application/contracts/CsvImportRowsDataSource';
import { CsvImportThesauriValuesDataSource } from '../contracts/CsvImportThesauriValuesDataSource';
import { Callbacks } from './types/UseCaseCallbacks';

type ThesauriWritePort = {
  appendRootLabelsIfMissing(thesaurusId: string, labels: string[]): Promise<void>;
  appendNestedLabelsIfMissing(
    thesaurusId: string,
    entries: Array<{ parent: string; child?: string }>
  ): Promise<void>;
};

type Input = {
  importId: string;
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
};

export class CsvPreflightJob extends AbstractUseCase<Input, Output, Deps> {
  private async setStatus(importId: string, status: CsvImportStatus) {
    const existing = await this.deps.csvImportsDS.getById(importId);
    if (!existing) {
      throw new Error(`CSV import not found: ${importId}`);
    }
    await this.transactionManager.run(async () => {
      const updated = CsvImportDomain.withStatus(existing, status);
      await this.deps.csvImportsDS.update(updated);
    });
  }

  async markAsFailed(importId: string) {
    await this.setStatus(importId, CsvImportStatus.Failed);
  }

  private async getImport(importId: string) {
    const csvImport = await this.deps.csvImportsDS.getById(importId);
    if (!csvImport) {
      throw new NonRetryableJobError(new Error(`CSV import not found: ${importId}`));
    }
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

  // eslint-disable-next-line max-statements
  protected async executeAsync(input: Input): Promise<Output> {
    const { importId, callbacks } = input;

    callbacks.onStart({ importId });
    await this.setStatus(importId, CsvImportStatus.PreflightThesauri);

    const csvImport = await this.getImport(importId);
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

    const { plan, issues: planIssues } = CsvThesauriValuesBuilder.build({
      importId,
      rows: stagedRows,
      template,
      headerAnalysis,
      defaultLanguage,
      newNameGeneration,
    });

    if (planIssues.length) {
      await this.transactionManager.run(async () => {
        const failed = CsvImportDomain.withFailure(
          CsvImportDomain.withStatus(csvImport, CsvImportStatus.Failed),
          {
            message: 'Thesauri values contain errors',
            retryable: false,
            at: Date.now(),
            stage: 'preflight:preparation:thesauri',
            code: 'THESAURI_VALUES_INVALID',
            issues: planIssues.map(issue => ({
              reason: issue.reason,
              message: issue.reason,
              property: issue.property,
            })),
          }
        );
        await this.deps.csvImportsDS.update(failed);
      });
      throw new NonRetryableJobError(new Error('Thesauri values contain errors'));
    }

    await this.deps.thesauriValuesDS.replacePlan(importId, plan.entries, plan.createdAt);

    await this.transactionManager.run(async () => {
      const clearedFailure = CsvImportDomain.clearFailure(csvImport);
      const updated = CsvImportDomain.withStatus(
        clearedFailure,
        CsvImportStatus.PreflightThesauriDone
      );
      await this.deps.csvImportsDS.update(updated);
    });

    // Notify success
    callbacks.onSuccess({ importId });

    return { importId, status: CsvImportStatus.PreflightThesauriDone };
  }
}

export {};
