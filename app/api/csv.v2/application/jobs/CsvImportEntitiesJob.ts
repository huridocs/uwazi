import { TransactionManager } from 'api/core/application/contracts/TransactionManager';
import { TemplatesDataSource } from 'api/core/application/contracts/TemplatesDataSource';
import { SettingsDataSource } from 'api/core/application/contracts/SettingsDataSource';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { Template } from 'api/core/domain/template/Template';
import { AbstractUseCase } from 'api/core/libs/UseCase';
import { NonRetryableJobError } from 'api/core/libs/queue/infrastructure/errors';
import { Entity } from 'api/core/domain/entity/Entity';
import { CsvHeaderAnalyzer, AnalyzerOptions } from '../services/CsvHeaderAnalyzer';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource';
import { CsvImportRowsDataSource } from '../contracts/CsvImportRowsDataSource';
import { CsvImportThesauriValuesDataSource } from '../contracts/CsvImportThesauriValuesDataSource';
import {
  CsvImportDomain,
  CsvImportStatus,
  CsvImportStats,
  CsvImport,
} from '../../domain/CsvImport';
import { Callbacks as BaseCallbacks } from './types/UseCaseCallbacks';
import { CsvEntitiesImportMapper, MappedAssignment } from '../services/CsvEntitiesImportMapper';

type Callbacks = BaseCallbacks & {
  onProgress: (info: {
    importId: string;
    processedRows: number;
    totalRows: number;
    batchIndex: number;
    batchCount: number;
    entitiesCreatedInBatch: number;
  }) => void;
};
type Input = {
  importId: string;
  callbacks: Callbacks;
};
type Deps = {
  csvImportsDS: CsvImportsDataSource;
  rowsDS: CsvImportRowsDataSource;
  thesauriValuesDS: CsvImportThesauriValuesDataSource;
  templatesDS: TemplatesDataSource;
  settingsDS: SettingsDataSource;
  entitiesDS: MultiLanguageEntityDataSource;
  mapper: CsvEntitiesImportMapper;
  transactionManager: TransactionManager;
};

type ImportContext = {
  csvImport: CsvImport;
  template: Template;
  languages: LanguageISO6391[];
  stagedRows: Awaited<ReturnType<CsvImportRowsDataSource['getByImport']>>;
  thesaurusIndex: Awaited<ReturnType<CsvEntitiesImportMapper['buildAppliedValuesIndex']>>;
  sanitizedHeaders: string[];
  headerAnalysis: ReturnType<typeof CsvHeaderAnalyzer.analyze>;
};

const buildEntityFromRow = (context: ImportContext, rowValues: string[]) => {
  const { template, languages, thesaurusIndex, sanitizedHeaders, headerAnalysis, csvImport } =
    context;

  const assignments = CsvEntitiesImportMapper.buildPropertyAssignments({
    template,
    headerAnalysis,
    sanitizedHeaders,
    rowValues,
    thesaurusIndex,
    languages,
  });

  const entity = Entity.create({
    languages,
    template,
    userId: csvImport.createdBy,
  });

  assignments.forEach((assignment: MappedAssignment) => {
    entity.setPropertyAssignments([assignment.value], assignment.language, false);
  });

  return entity;
};

class CsvImportEntitiesJob extends AbstractUseCase<Input, void, Deps> {
  private async setStatus(importId: string, status: CsvImportStatus) {
    const csvImport = (await this.deps.csvImportsDS.getById(importId)).getDataOrThrow();
    await this.transactionManager.run(async () => {
      const updated = CsvImportDomain.withStatus(csvImport, status);
      await this.deps.csvImportsDS.update(updated);
    });
  }

  async markAsFailed(importId: string) {
    await this.setStatus(importId, CsvImportStatus.Failed);
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
      await this.deps.csvImportsDS.update(withStatus);
    });
  }

  private async loadContext(importId: string): Promise<ImportContext> {
    const csvImport = (await this.deps.csvImportsDS.getById(importId)).getDataOrThrow();
    const template = (await this.deps.templatesDS.getById(csvImport.templateId)).getDataOrThrow();
    const [availableLanguages, defaultLanguage, settings, stagedRows, thesaurusIndex] =
      await Promise.all([
        this.deps.settingsDS.getLanguageKeys(),
        this.deps.settingsDS.getDefaultLanguageKey(),
        this.deps.settingsDS.get(),
        this.deps.rowsDS.getByImport(importId),
        this.deps.mapper.buildAppliedValuesIndex(importId),
      ]);

    if (!stagedRows.length) {
      throw new NonRetryableJobError(new Error(`No staged rows found for import ${importId}`));
    }
    const analyzerOptions: AnalyzerOptions = {
      availableLanguages,
      defaultLanguage,
      newNameGeneration: Boolean(settings?.newNameGeneration),
    };

    const sanitizedHeaders = CsvEntitiesImportMapper.sanitizeHeaders(
      stagedRows[0].headers,
      analyzerOptions.newNameGeneration
    );
    const headerAnalysis = CsvHeaderAnalyzer.analyze(
      stagedRows[0].headers,
      template,
      analyzerOptions
    );
    return {
      csvImport,
      template,
      languages: availableLanguages.map((lang: string): LanguageISO6391 => lang as LanguageISO6391),
      stagedRows,
      thesaurusIndex,
      sanitizedHeaders,
      headerAnalysis,
    };
  }

  private async processAndPersistRow(context: ImportContext, rowValues: string[]) {
    const entity = buildEntityFromRow(context, rowValues);
    await this.deps.entitiesDS.create(entity);
  }

  private async handleRowProcessing(params: {
    context: ImportContext;
    callbacks: Callbacks;
    rowValues: string[];
    index: number;
    totalRows: number;
  }) {
    const { context, callbacks, rowValues, index, totalRows } = params;
    await this.processAndPersistRow(context, rowValues);
    callbacks.onProgress({
      importId: context.csvImport.id,
      processedRows: index + 1,
      totalRows,
      batchIndex: index + 1,
      batchCount: totalRows,
      entitiesCreatedInBatch: 1,
    });
  }

  private async processRows(params: {
    context: ImportContext;
    callbacks: Callbacks;
  }): Promise<{ entitiesCreated: number; processedRows: number }> {
    const { context, callbacks } = params;
    const { stagedRows } = context;
    const totalRows = stagedRows.length;

    let processedRows = 0;
    let entitiesCreated = 0;

    for (const [index, row] of stagedRows.entries()) {
      // eslint-disable-next-line no-await-in-loop
      await this.handleRowProcessing({
        context,
        callbacks,
        rowValues: row.values,
        index,
        totalRows,
      });
      entitiesCreated += 1;
      processedRows += 1;
    }

    return { entitiesCreated, processedRows };
  }

  private async finalizeSuccess(csvImport: CsvImport, entitiesCreated: number) {
    await this.transactionManager.run(async () => {
      const updatedStats: CsvImportStats = {
        ...(csvImport.stats || {}),
        entitiesCreated: (csvImport.stats?.entitiesCreated || 0) + entitiesCreated,
      };
      const cleared = CsvImportDomain.clearFailure(csvImport);
      const withStatus = CsvImportDomain.withStatus(cleared, CsvImportStatus.ImportEntitiesDone);
      await this.deps.csvImportsDS.update(withStatus.withStats(updatedStats));
    });
  }

  private async runImport(importId: string, callbacks: Callbacks) {
    const context = await this.loadContext(importId);
    const { entitiesCreated } = await this.processRows({ context, callbacks });
    await this.finalizeSuccess(context.csvImport, entitiesCreated);
  }

  async execute(input: Input): Promise<void> {
    const { importId, callbacks } = input;

    callbacks.onStart({ importId });
    await this.setStatus(importId, CsvImportStatus.ImportEntities);

    try {
      await this.runImport(importId, callbacks);
      callbacks.onSuccess({ importId });
    } catch (error) {
      await this.persistFailure(importId, error as Error);
      callbacks.onError({ importId, error: error as Error });
      throw error;
    }
  }
}

export { CsvImportEntitiesJob };
