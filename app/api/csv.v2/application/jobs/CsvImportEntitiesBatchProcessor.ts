import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { EntitiesService } from '#api/core/application/EntitiesService.js';
import { FilesService } from '#api/core/application/FilesService.js';
import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { Template } from '#api/core/domain/template/Template.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { CsvImport, CsvImportDomain } from '../../domain/CsvImport.js';
import { CsvImportRow } from '../../domain/CsvImportRow.js';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource.js';
import { CsvImportRowErrorsDataSource } from '../contracts/CsvImportRowErrorsDataSource.js';
import { AppliedValueIndex, CsvEntitiesImportMapper } from '../services/CsvEntitiesImportMapper.js';
import { CsvHeaderAnalyzer } from '../services/CsvHeaderAnalyzer.js';
import { CsvImportRowFilesResolver } from '../services/CsvImportRowFilesResolver.js';
import { CsvImportRowEmptyError } from '../services/CsvImportRowProcessingError.js';
import { createPropertyAssignments, isEmptyRow } from './CsvImportEntitiesPropertyAssignments.js';
import {
  createRowProcessingState,
  trackFailedRow,
  trackImportedRow,
} from './CsvImportEntitiesBatchRowState.js';

type BatchContext = {
  csvImport: CsvImport;
  template: Template;
  languages: LanguageISO6391[];
  defaultLanguage: LanguageISO6391;
  dateFormat?: string;
  thesaurusIndex: AppliedValueIndex;
  relationshipIndex: Awaited<ReturnType<CsvEntitiesImportMapper['buildRelationshipValuesIndex']>>;
  sanitizedHeaders: string[];
  headerAnalysis: ReturnType<typeof CsvHeaderAnalyzer.analyze>;
};

type BatchDeps = {
  entitiesService: EntitiesService;
  csvImportsDS: CsvImportsDataSource;
  rowErrorsDS: CsvImportRowErrorsDataSource;
  transactionManager: TransactionManager;
  propertyAssignmentCreatorServiceStrategy: PropertyAssignmentCreatorServiceStrategy;
  filesService: FilesService;
  fileStorage: FileStorage;
  idGenerator: IdGenerator;
};

type InsertContext = {
  tenantName: string;
  actorId: string;
  targetLanguage: LanguageISO6391;
};

type RowState = ReturnType<typeof createRowProcessingState>;
type RowFiles = Awaited<ReturnType<typeof CsvImportRowFilesResolver.resolve>>;

const buildEntityFromRow = (context: BatchContext) =>
  Entity.create({
    languages: context.languages,
    template: context.template,
    userId: context.csvImport.createdBy,
  });

const createAttachmentLookup = (files: RowFiles) => (filename: string) => {
  const normalized = filename?.trim();
  if (!normalized || !files.attachmentFilenameByOriginalName.has(normalized)) {
    return undefined;
  }
  const index = files.attachments.findIndex(
    attachment => attachment.metadata.originalname === normalized
  );
  return index >= 0 ? index : undefined;
};

const prepareRowImport = async (params: {
  deps: BatchDeps;
  context: BatchContext;
  rowValues: string[];
}) => {
  if (isEmptyRow(params.rowValues)) {
    throw new CsvImportRowEmptyError();
  }

  const files = await CsvImportRowFilesResolver.resolve({
    importId: params.context.csvImport.id,
    rowValues: params.rowValues,
    sanitizedHeaders: params.context.sanitizedHeaders,
    headerAnalysis: params.context.headerAnalysis,
    fileStorage: params.deps.fileStorage,
  });

  const assignments = CsvEntitiesImportMapper.buildPropertyAssignments({
    template: params.context.template,
    headerAnalysis: params.context.headerAnalysis,
    sanitizedHeaders: params.context.sanitizedHeaders,
    rowValues: params.rowValues,
    thesaurusIndex: params.context.thesaurusIndex,
    relationshipIndex: params.context.relationshipIndex,
    languages: params.context.languages,
    defaultLanguage: params.context.defaultLanguage,
    dateFormat: params.context.dateFormat,
    attachmentLookup: createAttachmentLookup(files),
  });

  const propertyAssignments = await createPropertyAssignments({
    propertyAssignmentCreatorServiceStrategy: params.deps.propertyAssignmentCreatorServiceStrategy,
    template: params.context.template,
    assignments,
    sanitizedHeaders: params.context.sanitizedHeaders,
    rowValues: params.rowValues,
    attachments: files.attachments,
  });

  const entity = buildEntityFromRow(params.context);
  entity.setPropertyAssignmentsInAllLanguages(propertyAssignments, false);
  const entityFiles = [...files.documents, ...files.attachments].map(inputFile =>
    inputFile.toEntityFile(entity.sharedId, params.deps.idGenerator.generate())
  );
  await params.deps.filesService.storeFiles(entityFiles);
  return { entity, entityFiles };
};

const buildRowProgress = (params: {
  totalRows: number;
  processedRows: number;
  offset: number;
  rowOffset: number;
  batchSize: number;
}) => ({
  totalRows: params.totalRows,
  processedRows: params.processedRows + params.rowOffset + 1,
  lastProcessedRow: params.offset + params.rowOffset,
  batchSize: params.batchSize,
});

const processSingleBatchRow = async (params: {
  deps: BatchDeps;
  context: BatchContext;
  row: CsvImportRow;
  rowOffset: number;
  totalRows: number;
  processedRows: number;
  offset: number;
  batchSize: number;
  state: RowState;
  currentImport: CsvImport;
  insertContext: InsertContext;
}) => {
  const updatedImport = CsvImportDomain.withProgress(
    params.currentImport,
    buildRowProgress(params)
  );

  try {
    const { entity, entityFiles } = await prepareRowImport({
      deps: params.deps,
      context: params.context,
      rowValues: params.row.values,
    });

    await params.deps.transactionManager.run(async () => {
      await params.deps.entitiesService.insert(entity, params.insertContext);
      await params.deps.filesService.insert(entityFiles);
      await params.deps.csvImportsDS.update(updatedImport);
    });

    return { state: trackImportedRow(params.state), currentImport: updatedImport };
  } catch (error) {
    const failedState = trackFailedRow({
      state: params.state,
      csvImport: params.context.csvImport,
      row: params.row,
      error,
    });
    const rowError = failedState.errors[failedState.errors.length - 1];

    await params.deps.transactionManager.run(async () => {
      await params.deps.csvImportsDS.update(updatedImport);
      await params.deps.rowErrorsDS.insertMany(rowError ? [rowError] : []);
    });

    return { state: failedState, currentImport: updatedImport };
  }
};

const processBatchRows = async (params: {
  deps: BatchDeps;
  context: BatchContext;
  rows: CsvImportRow[];
  csvImport: CsvImport;
  insertContext: InsertContext;
  totalRows: number;
  offset: number;
  processedRows: number;
  batchSize: number;
}) =>
  Array.from(params.rows.entries()).reduce<Promise<{ state: RowState; currentImport: CsvImport }>>(
    async (accPromise, [rowOffset, row]) => {
      const acc = await accPromise;
      return processSingleBatchRow({
        ...params,
        row,
        rowOffset,
        state: acc.state,
        currentImport: acc.currentImport,
      });
    },
    Promise.resolve({ state: createRowProcessingState(), currentImport: params.csvImport })
  );

const processImportBatch = async (params: {
  deps: BatchDeps;
  context: BatchContext;
  insertContext: InsertContext;
  rows: CsvImportRow[];
  offset: number;
  totalRows: number;
  processedRows: number;
  batchSize: number;
  csvImport: CsvImport;
}) => {
  const { state, currentImport } = await processBatchRows(params);
  return {
    entitiesCreated: state.created,
    processedRows: params.processedRows + params.rows.length,
    csvImport: currentImport,
    rowErrorsCount: state.errors.length,
    endConsecutiveFailures: state.consecutiveFailures,
    maxConsecutiveFailures: state.maxConsecutiveFailures,
  };
};

export type { BatchContext };
export { processImportBatch };
