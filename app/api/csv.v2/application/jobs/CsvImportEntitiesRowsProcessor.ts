import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FilesService } from '#api/core/application/FilesService.js';
import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { CsvImport } from '../../domain/CsvImport.js';
import { CsvImportRowErrorsDataSource } from '../contracts/CsvImportRowErrorsDataSource.js';
import { CsvImportRowsDataSource } from '../contracts/CsvImportRowsDataSource.js';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource.js';
import { processImportBatch } from './CsvImportEntitiesBatchProcessor.js';
import { evaluateStopPolicy } from '../services/CsvImportEntitiesErrorReporting.js';
import { Callbacks, ImportContext } from './CsvImportEntitiesTypes.js';

type ProcessRowsDeps = {
  rowsDS: CsvImportRowsDataSource;
  rowErrorsDS: CsvImportRowErrorsDataSource;
  csvImportsDS: CsvImportsDataSource;
  entitiesDS: MultiLanguageEntityDataSource;
  transactionManager: TransactionManager;
  propertyAssignmentCreatorServiceStrategy: PropertyAssignmentCreatorServiceStrategy;
  filesService: FilesService;
  fileStorage: FileStorage;
  idGenerator: IdGenerator;
};

type FailurePolicy = {
  warmupRows: number;
  failureRatioStop: number;
  consecutiveStop: number;
  absoluteStop: number;
};

const processImportRows = async (params: {
  context: ImportContext;
  callbacks: Callbacks;
  deps: ProcessRowsDeps;
  batchSize: number;
  failurePolicy: FailurePolicy;
}): Promise<{
  entitiesCreated: number;
  processedRows: number;
  csvImport: CsvImport;
  shouldStop: boolean;
  stopReason?: string;
}> => {
  const { context, callbacks, deps, batchSize, failurePolicy } = params;
  const { totalRows } = context;
  let processedRows = context.csvImport.progress?.processedRows ?? 0;
  const startOffset = Math.min(
    totalRows,
    Math.max(0, (context.csvImport.progress?.lastProcessedRow ?? -1) + 1)
  );
  let entitiesCreated = 0;
  let currentImport = context.csvImport;
  const remainingRows = Math.max(0, totalRows - startOffset);
  const batchCount = remainingRows ? Math.ceil(remainingRows / batchSize) : 0;
  let batchIndex = 0;
  let totalFailures = await deps.rowErrorsDS.countByImport(context.csvImport.id);
  let consecutiveFailures = 0;

  for (let offset = startOffset; offset < totalRows; offset += batchSize) {
    // eslint-disable-next-line no-await-in-loop
    const rows = await deps.rowsDS.getByImport(context.csvImport.id, offset, batchSize);
    if (!rows.length) {
      break;
    }
    batchIndex += 1;
    // eslint-disable-next-line no-await-in-loop
    const batchResult = await processImportBatch({
      deps: {
        entitiesDS: deps.entitiesDS,
        csvImportsDS: deps.csvImportsDS,
        rowErrorsDS: deps.rowErrorsDS,
        transactionManager: deps.transactionManager,
        propertyAssignmentCreatorServiceStrategy: deps.propertyAssignmentCreatorServiceStrategy,
        filesService: deps.filesService,
        fileStorage: deps.fileStorage,
        idGenerator: deps.idGenerator,
      },
      context,
      rows,
      offset,
      totalRows,
      processedRows,
      batchSize,
      csvImport: currentImport,
    });
    processedRows = batchResult.processedRows;
    entitiesCreated += batchResult.entitiesCreated;
    currentImport = batchResult.csvImport;
    totalFailures += batchResult.rowErrorsCount;
    consecutiveFailures = batchResult.endConsecutiveFailures;
    callbacks.onProgress({
      importId: context.csvImport.id,
      processedRows,
      totalRows,
      batchIndex,
      batchCount,
      entitiesCreatedInBatch: batchResult.entitiesCreated,
    });

    const stopDecision = evaluateStopPolicy({
      processedRows,
      totalFailures,
      maxConsecutiveFailures: Math.max(consecutiveFailures, batchResult.maxConsecutiveFailures),
      warmupRows: failurePolicy.warmupRows,
      failureRatioStop: failurePolicy.failureRatioStop,
      consecutiveStop: failurePolicy.consecutiveStop,
      absoluteStop: failurePolicy.absoluteStop,
    });
    if (stopDecision.shouldStop) {
      return {
        entitiesCreated,
        processedRows,
        csvImport: currentImport,
        shouldStop: true,
        stopReason: stopDecision.reason,
      };
    }
  }

  return { entitiesCreated, processedRows, csvImport: currentImport, shouldStop: false };
};

export { processImportRows };
