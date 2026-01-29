/* eslint-disable max-lines */
import { SettingsDataSource } from 'api/core/application/contracts/SettingsDataSource';
import { TemplatesDataSource } from 'api/core/application/contracts/TemplatesDataSource';
import { TransactionManager } from 'api/core/application/contracts/TransactionManager';
import { Entity } from 'api/core/domain/entity/Entity';
import { Template } from 'api/core/domain/template/Template';
import { V1RelationshipProperty } from 'api/core/domain/template/V1RelationshipProperty';
import { AbstractUseCase } from 'api/core/libs/UseCase';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { NonRetryableJobError } from 'api/core/libs/queue/infrastructure/errors';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { CsvImportEntitiesJobHandler } from '../../infrastructure/jobHandlers/CsvImportEntitiesJobHandler';
import { CsvImport, CsvImportDomain, CsvImportStatus } from '../../domain/CsvImport';
import { CsvEntitiesImportMapper } from '../services/CsvEntitiesImportMapper';
import { CsvHeaderAnalyzer, AnalyzerOptions } from '../services/CsvHeaderAnalyzer';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource';
import { CsvImportRowsDataSource } from '../contracts/CsvImportRowsDataSource';
import { CsvImportRelationshipValuesDataSource } from '../contracts/CsvImportRelationshipValuesDataSource';
import { Callbacks as BaseCallbacks } from './types/UseCaseCallbacks';
import {
  CsvImportRelationshipValue,
  CsvImportRelationshipValues,
} from '../../domain/CsvImportRelationshipValues';

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

const MULTI_VALUE_SEPARATOR = '|';

const splitRelationshipValues = (rawValue: unknown) => {
  if (rawValue === null || rawValue === undefined) {
    return [];
  }
  const stringValue = String(rawValue);
  return stringValue
    .split(MULTI_VALUE_SEPARATOR)
    .filter(value => value.trim() !== '')
    .filter((value, index, list) => list.indexOf(value) === index);
};

type RelationshipColumn = {
  property: V1RelationshipProperty;
  index: number;
};

const buildRelationshipColumnMap = (params: { template: Template; sanitizedHeaders: string[] }) => {
  const { template, sanitizedHeaders } = params;
  return template.allProperties
    .filter(
      (property): property is V1RelationshipProperty => property instanceof V1RelationshipProperty
    )
    .map(property => ({
      property,
      index: sanitizedHeaders.findIndex(header => header === property.name),
    }))
    .filter(({ index }) => index >= 0);
};

const addTitlesForRow = (params: {
  rowValues: string[];
  columns: RelationshipColumn[];
  titlesByTemplate: Map<string, Set<string>>;
}) => {
  const { rowValues, columns, titlesByTemplate } = params;
  columns.forEach(({ property, index }) => {
    const templateId = property.content;
    if (!templateId) {
      return;
    }
    const titles = splitRelationshipValues(rowValues[index]);
    if (!titles.length) {
      return;
    }
    const set = titlesByTemplate.get(templateId) || new Set<string>();
    titles.forEach(title => set.add(title));
    titlesByTemplate.set(templateId, set);
  });
};

const chunkList = <T>(items: T[], size: number) => {
  if (!items.length) {
    return [];
  }
  const chunkSize = Math.max(1, size);
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
};

const mergeKnownTitles = (known: Set<string>, incoming: string[]) => {
  incoming.forEach(title => known.add(title));
};

const buildMissingTitles = (titles: string[], known: Set<string>) =>
  titles.filter(title => !known.has(title));

const collectKnownTitles = async (params: {
  deps: Deps;
  templateId: string;
  titles: string[];
  chunkSize: number;
}) => {
  const { deps, templateId, titles, chunkSize } = params;
  const knownTitles = new Set<string>();
  const chunks = chunkList(titles, chunkSize);
  for (const chunk of chunks) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await deps.entitiesDS.getSharedIdsByTemplateAndTitles(templateId, chunk);
    mergeKnownTitles(
      knownTitles,
      existing.map(entry => entry.title)
    );
  }
  return knownTitles;
};

// eslint-disable-next-line max-statements
const collectRelationshipTitlesForImport = async (params: {
  deps: Deps;
  importId: string;
  template: Template;
  sanitizedHeaders: string[];
  totalRows: number;
  callbacks: Callbacks;
  batchSize: number;
}) => {
  const { deps, importId, template, sanitizedHeaders, totalRows, callbacks, batchSize } = params;
  const relationshipColumns = buildRelationshipColumnMap({ template, sanitizedHeaders });
  const titlesByTemplate = new Map<string, Set<string>>();

  let processedRows = 0;
  for (let offset = 0; offset < totalRows; offset += batchSize) {
    // eslint-disable-next-line no-await-in-loop
    const rows = await deps.rowsDS.getByImport(importId, offset, batchSize);
    if (!rows.length) {
      break;
    }
    rows.forEach(row =>
      addTitlesForRow({
        rowValues: row.values,
        columns: relationshipColumns,
        titlesByTemplate,
      })
    );
    processedRows = Math.min(totalRows, offset + rows.length);
    callbacks.onProgress({
      importId,
      processedRows,
      totalRows,
      createdEntities: 0,
    });
  }

  return titlesByTemplate;
};

// eslint-disable-next-line max-statements
const createMissingEntitiesForTitles = async (params: {
  deps: Deps;
  titlesByTemplate: Map<string, Set<string>>;
  defaultLanguage: LanguageISO6391;
  userId: string;
}) => {
  const { deps, titlesByTemplate, defaultLanguage, userId } = params;
  let createdEntities = 0;
  const templateCache = new Map<string, Template>();

  for (const [templateId, titlesSet] of titlesByTemplate.entries()) {
    const titles = Array.from(titlesSet);
    if (titles.length) {
      const chunks = chunkList(titles, RELATIONSHIP_TITLES_CHUNK_SIZE);
      // eslint-disable-next-line no-await-in-loop
      const knownTitles = await collectKnownTitles({
        deps,
        templateId,
        titles,
        chunkSize: RELATIONSHIP_TITLES_CHUNK_SIZE,
      });
      let targetTemplate = templateCache.get(templateId);
      if (!targetTemplate) {
        // eslint-disable-next-line no-await-in-loop
        targetTemplate = (await deps.templatesDS.getById(templateId)).getDataOrThrow();
        templateCache.set(templateId, targetTemplate);
      }
      for (const chunk of chunks) {
        const missingTitles = buildMissingTitles(chunk, knownTitles);
        if (missingTitles.length) {
          const entities = missingTitles.map(title => {
            const entity = Entity.create({
              languages: [defaultLanguage],
              template: targetTemplate!,
              userId,
            });
            entity.setPropertyAssignmentsInAllLanguages([
              targetTemplate!.createPropertyAssignment('title', {
                value: [{ value: title }],
              }),
            ]);
            return entity;
          });
          // eslint-disable-next-line no-await-in-loop
          await deps.transactionManager.run(async () => {
            await deps.entitiesDS.bulkInsert(entities);
          });
          mergeKnownTitles(knownTitles, missingTitles);
          createdEntities += entities.length;
        }
      }
    }
  }

  return createdEntities;
};

// eslint-disable-next-line max-statements
const buildRelationshipAppliedValues = async (params: {
  deps: Deps;
  importId: string;
  titlesByTemplate: Map<string, Set<string>>;
  chunkSize: number;
}) => {
  const { deps, importId, titlesByTemplate, chunkSize } = params;
  const docs: CsvImportRelationshipValues[] = [];

  for (const [templateId, titlesSet] of titlesByTemplate.entries()) {
    const titles = Array.from(titlesSet);
    if (titles.length) {
      const chunks = chunkList(titles, chunkSize);
      const values: CsvImportRelationshipValue[] = [];
      const seen = new Set<string>();
      for (const chunk of chunks) {
        // eslint-disable-next-line no-await-in-loop
        const existing = await deps.entitiesDS.getSharedIdsByTemplateAndTitles(templateId, chunk);
        existing.forEach(entry => {
          if (seen.has(entry.sharedId)) {
            return;
          }
          seen.add(entry.sharedId);
          values.push({ label: entry.title, sharedId: entry.sharedId });
        });
      }
      docs.push(
        CsvImportRelationshipValues.create({
          importId,
          templateId,
          values,
          createdAt: Date.now(),
        })
      );
    }
  }

  return docs;
};
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
      ...params,
      deps: this.deps,
      batchSize: this.getBatchSize(),
    });
  }

  private async createMissingEntities(params: {
    titlesByTemplate: Map<string, Set<string>>;
    defaultLanguage: LanguageISO6391;
    userId: string;
  }) {
    return createMissingEntitiesForTitles({
      ...params,
      deps: this.deps,
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

  // eslint-disable-next-line max-statements
  async execute(input: Input): Promise<void> {
    const { importId, tenantName, userId, callbacks } = input;

    callbacks.onStart({ importId });
    await this.setStatus(importId, CsvImportStatus.PreflightRelationships);

    try {
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
        deps: this.deps,
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
