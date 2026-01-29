import { SettingsDataSource } from 'api/core/application/contracts/SettingsDataSource';
import { TemplatesDataSource } from 'api/core/application/contracts/TemplatesDataSource';
import { TransactionManager } from 'api/core/application/contracts/TransactionManager';
import { AbstractUseCase } from 'api/core/libs/UseCase';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { NonRetryableJobError } from 'api/core/libs/queue/infrastructure/errors';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { Template } from 'api/core/domain/template/Template';
import { CsvImportEntitiesJobHandler } from '../../infrastructure/jobHandlers/CsvImportEntitiesJobHandler';
import { CsvImport, CsvImportDomain, CsvImportStatus } from '../../domain/CsvImport';
import { CsvEntitiesImportMapper } from '../services/CsvEntitiesImportMapper';
import { CsvHeaderAnalyzer, AnalyzerOptions } from '../services/CsvHeaderAnalyzer';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource';
import { CsvImportRowsDataSource } from '../contracts/CsvImportRowsDataSource';
import { CsvImportRelationshipValuesDataSource } from '../contracts/CsvImportRelationshipValuesDataSource';
import { Callbacks as BaseCallbacks } from './types/UseCaseCallbacks';
import { CsvImportRelationshipValues } from '../../domain/CsvImportRelationshipValues';
import {
  buildRelationshipAppliedValues,
  collectRelationshipTitlesForImport,
  createMissingEntitiesForTitles,
} from '../services/CsvPreflightRelationshipsService';

type RelationshipsProgress = {
  importId: string;
  processedRows: number;
  totalRows: number;
  createdEntities: number;
};

type Callbacks = BaseCallbacks & {
  onProgress: (info: RelationshipsProgress) => void;
};

type Input = {
  importId: string;
  tenantName: string;
  userId: string;
  callbacks: Callbacks;
};

type Deps = {
  csvImportsDS: CsvImportsDataSource;
  rowsDS: CsvImportRowsDataSource;
  templatesDS: TemplatesDataSource;
  settingsDS: SettingsDataSource;
  entitiesDS: MultiLanguageEntityDataSource;
  relationshipValuesDS: CsvImportRelationshipValuesDataSource;
  transactionManager: TransactionManager;
  jobsDispatcher: JobsDispatcher;
  batchSize?: number;
};

const DEFAULT_BATCH_SIZE = 1000;
const RELATIONSHIP_TITLES_CHUNK_SIZE = 250;

class CsvPreflightRelationshipsJob extends AbstractUseCase<Input, void, Deps> {
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
        stage: 'preflight:relationships',
      });
      const withStatus = CsvImportDomain.withStatus(
        withFailure,
        error instanceof NonRetryableJobError ? CsvImportStatus.Failed : CsvImportStatus.Retrying
      );
      await this.deps.csvImportsDS.update(withStatus);
    });
  }

  private async loadContext(importId: string) {
    const csvImport = (await this.deps.csvImportsDS.getById(importId)).getDataOrThrow();
    const template = (await this.deps.templatesDS.getById(csvImport.templateId)).getDataOrThrow();
    const [settings, availableLanguages, defaultLanguage, totalRows, firstRow] = await Promise.all([
      this.deps.settingsDS.get(),
      this.deps.settingsDS.getLanguageKeys(),
      this.deps.settingsDS.getDefaultLanguageKey(),
      this.deps.rowsDS.countByImport(importId),
      this.deps.rowsDS.getByImport(importId, 0, 1),
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
    CsvHeaderAnalyzer.analyze(firstRow[0].headers, template, analyzerOptions);

    return {
      csvImport,
      template,
      defaultLanguage: defaultLanguage as LanguageISO6391,
      totalRows,
      sanitizedHeaders,
    };
  }

  private async collectRelationshipTitles(params: {
    importId: string;
    template: Template;
    sanitizedHeaders: string[];
    totalRows: number;
    callbacks: Callbacks;
  }) {
    return collectRelationshipTitlesForImport({
      rowsDS: this.deps.rowsDS,
      importId: params.importId,
      template: params.template,
      sanitizedHeaders: params.sanitizedHeaders,
      totalRows: params.totalRows,
      batchSize: this.getBatchSize(),
      onProgress: info =>
        params.callbacks.onProgress({
          importId: params.importId,
          processedRows: info.processedRows,
          totalRows: info.totalRows,
          createdEntities: 0,
        }),
    });
  }

  private async createMissingEntities(params: {
    titlesByTemplate: Map<string, Set<string>>;
    defaultLanguage: LanguageISO6391;
    userId: string;
  }) {
    return createMissingEntitiesForTitles({
      entitiesDS: this.deps.entitiesDS,
      templatesDS: this.deps.templatesDS,
      titlesByTemplate: params.titlesByTemplate,
      defaultLanguage: params.defaultLanguage,
      userId: params.userId,
      chunkSize: RELATIONSHIP_TITLES_CHUNK_SIZE,
      transactionManager: this.deps.transactionManager,
    });
  }

  private async finalizeSuccess(params: {
    csvImport: CsvImport;
    relationshipDocs: CsvImportRelationshipValues[];
    importId: string;
    tenantName: string;
    userId: string;
  }) {
    const { csvImport, relationshipDocs, importId, tenantName, userId } = params;
    await this.transactionManager.run(async () => {
      const cleared = CsvImportDomain.clearFailure(csvImport);
      const withStatus = CsvImportDomain.withStatus(
        cleared,
        CsvImportStatus.PreflightRelationshipsDone
      );
      await this.deps.csvImportsDS.update(withStatus);
      await this.deps.relationshipValuesDS.replaceValues(importId, relationshipDocs);
      await this.deps.jobsDispatcher.dispatch(CsvImportEntitiesJobHandler, {
        tenantName,
        userId,
        importId,
      });
    });
  }

  private async runPreflight(importId: string, callbacks: Callbacks) {
    const context = await this.loadContext(importId);
    const titlesByTemplate = await this.collectRelationshipTitles({
      importId,
      template: context.template,
      sanitizedHeaders: context.sanitizedHeaders,
      totalRows: context.totalRows,
      callbacks,
    });
    const createdEntities = await this.createMissingEntities({
      titlesByTemplate,
      defaultLanguage: context.defaultLanguage,
      userId: context.csvImport.createdBy,
    });
    const relationshipDocs = await buildRelationshipAppliedValues({
      entitiesDS: this.deps.entitiesDS,
      importId,
      titlesByTemplate,
      chunkSize: RELATIONSHIP_TITLES_CHUNK_SIZE,
    });
    callbacks.onProgress({
      importId,
      processedRows: context.totalRows,
      totalRows: context.totalRows,
      createdEntities,
    });

    return { context, createdEntities, relationshipDocs };
  }

  async execute(input: Input): Promise<void> {
    const { importId, tenantName, userId, callbacks } = input;

    callbacks.onStart({ importId });
    await this.setStatus(importId, CsvImportStatus.PreflightRelationships);

    try {
      const { context, relationshipDocs } = await this.runPreflight(importId, callbacks);
      await this.finalizeSuccess({
        csvImport: context.csvImport,
        relationshipDocs,
        importId,
        tenantName,
        userId,
      });
      callbacks.onSuccess({ importId });
    } catch (error) {
      await this.persistFailure(importId, error as Error);
      callbacks.onError({ importId, error: error as Error });
      throw error;
    }
  }
}

export { CsvPreflightRelationshipsJob };
