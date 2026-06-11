import { CsvImport, CsvImportDomain } from '../../domain/CsvImport.js';
import { CsvImportRow } from '../../domain/CsvImportRow.js';
import {
  createEntityForImportRow,
  updateEntityForImportRow,
} from './CsvImportEntitiesRowPersistence.js';
import { getRowValueByHeader, prepareRowImport } from './CsvImportEntitiesRowPreparation.js';
import { BatchContext, BatchDeps, InsertContext } from './CsvImportEntitiesBatchTypes.js';
import {
  createRowProcessingState,
  trackFailedRow,
  trackImportedRow,
  trackUpdatedRow,
} from './CsvImportEntitiesBatchRowState.js';

type RowState = ReturnType<typeof createRowProcessingState>;

const ID_COLUMN = 'id';

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

const processPreparedRow = async (params: {
  deps: BatchDeps;
  context: BatchContext;
  insertContext: InsertContext;
  state: RowState;
  updatedImport: CsvImport;
  rowId?: string;
  prepared: Awaited<ReturnType<typeof prepareRowImport>>;
}) => {
  if (params.rowId) {
    await updateEntityForImportRow({
      deps: params.deps,
      context: params.context,
      rowId: params.rowId,
      propertyAssignments: params.prepared.propertyAssignments,
      files: params.prepared.files,
      insertContext: {
        actorId: params.insertContext.actorId,
        targetLanguage: params.insertContext.targetLanguage,
      },
      updatedImport: params.updatedImport,
    });
    return { state: trackUpdatedRow(params.state), currentImport: params.updatedImport };
  }

  await createEntityForImportRow({
    deps: params.deps,
    context: params.context,
    propertyAssignments: params.prepared.propertyAssignments,
    files: params.prepared.files,
    insertContext: params.insertContext,
    updatedImport: params.updatedImport,
  });

  return { state: trackImportedRow(params.state), currentImport: params.updatedImport };
};

const processFailedRow = async (params: {
  deps: BatchDeps;
  context: BatchContext;
  row: CsvImportRow;
  state: RowState;
  updatedImport: CsvImport;
  error: unknown;
}) => {
  const failedState = trackFailedRow({
    state: params.state,
    csvImport: params.context.csvImport,
    row: params.row,
    error: params.error,
  });
  const rowError = failedState.errors[failedState.errors.length - 1];

  await params.deps.transactionManager.run(async () => {
    await params.deps.csvImportsDS.update(params.updatedImport);
    await params.deps.rowErrorsDS.insertMany(rowError ? [rowError] : []);
  });

  return { state: failedState, currentImport: params.updatedImport };
};

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
    const prepared = await prepareRowImport({
      importId: params.context.csvImport.id,
      rowValues: params.row.values,
      sanitizedHeaders: params.context.sanitizedHeaders,
      headerAnalysis: params.context.headerAnalysis,
      template: params.context.template,
      thesaurusIndex: params.context.thesaurusIndex,
      relationshipIndex: params.context.relationshipIndex,
      languages: params.context.languages,
      defaultLanguage: params.context.defaultLanguage,
      dateFormat: params.context.dateFormat,
      fileStorage: params.deps.fileStorage,
      propertyAssignmentCreatorServiceStrategy:
        params.deps.propertyAssignmentCreatorServiceStrategy,
    });

    const rowId = getRowValueByHeader(
      params.row.values,
      params.context.sanitizedHeaders,
      ID_COLUMN
    );
    return await processPreparedRow({
      deps: params.deps,
      context: params.context,
      insertContext: params.insertContext,
      state: params.state,
      updatedImport,
      rowId,
      prepared,
    });
  } catch (error) {
    return processFailedRow({
      deps: params.deps,
      context: params.context,
      row: params.row,
      error,
      state: params.state,
      updatedImport,
    });
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
    entitiesUpdated: state.updated,
    processedRows: params.processedRows + params.rows.length,
    csvImport: currentImport,
    rowErrorsCount: state.errors.length,
    endConsecutiveFailures: state.consecutiveFailures,
    maxConsecutiveFailures: state.maxConsecutiveFailures,
  };
};

export type { BatchContext };
export { processImportBatch };
