import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { EntitiesService } from '#api/core/application/EntitiesService.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FilesService } from '#api/core/application/FilesService.js';
import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { FilesDataSource } from '#api/core/application/contracts/FilesDataSource.js';
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
  entitiesService: EntitiesService;
  entitiesDS: MultiLanguageEntityDataSource;
  filesDS: FilesDataSource;
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
  tenantName: string;
  actorId: string;
  batchSize: number;
  failurePolicy: FailurePolicy;
}): Promise<{
  entitiesCreated: number;
  entitiesUpdated: number;
  processedRows: number;
  csvImport: CsvImport;
  shouldStop: boolean;
  cancelled: boolean;
  stopReason?: string;
}> => {
  const { context, callbacks, deps, batchSize, failurePolicy, tenantName, actorId } = params;
  const { totalRows } = context;
  let processedRows = context.csvImport.progress?.processedRows ?? 0;
  const startOffset = Math.min(
    totalRows,
    Math.max(0, (context.csvImport.progress?.lastProcessedRow ?? -1) + 1)
  );
  let entitiesCreated = 0;
  let entitiesUpdated = 0;
  let currentImport = context.csvImport;
  const remainingRows = Math.max(0, totalRows - startOffset);
  const batchCount = remainingRows ? Math.ceil(remainingRows / batchSize) : 0;
  let batchIndex = 0;
  let totalFailures = await deps.rowErrorsDS.countByImport(context.csvImport.id);
  let consecutiveFailures = 0;

  for (let offset = startOffset; offset < totalRows; offset += batchSize) {
    // eslint-disable-next-line no-await-in-loop
    if (await deps.csvImportsDS.isCancelled(context.csvImport.id)) {
      return {
        entitiesCreated,
        entitiesUpdated,
        processedRows,
        csvImport: currentImport,
        shouldStop: false,
        cancelled: true,
      };
    }
    // eslint-disable-next-line no-await-in-loop
    const rows = await deps.rowsDS.getByImport(context.csvImport.id, offset, batchSize);
    if (!rows.length) {
      break;
    }
    batchIndex += 1;
    // eslint-disable-next-line no-await-in-loop
    const batchResult = await processImportBatch({
      deps: {
        entitiesService: deps.entitiesService,
        entitiesDS: deps.entitiesDS,
        filesDS: deps.filesDS,
        csvImportsDS: deps.csvImportsDS,
        rowErrorsDS: deps.rowErrorsDS,
        transactionManager: deps.transactionManager,
        propertyAssignmentCreatorServiceStrategy: deps.propertyAssignmentCreatorServiceStrategy,
        filesService: deps.filesService,
        fileStorage: deps.fileStorage,
        idGenerator: deps.idGenerator,
      },
      context,
      insertContext: {
        tenantName,
        actorId,
        targetLanguage: context.defaultLanguage,
      },
      rows,
      offset,
      totalRows,
      processedRows,
      batchSize,
      csvImport: currentImport,
    });
    processedRows = batchResult.processedRows;
    entitiesCreated += batchResult.entitiesCreated;
    entitiesUpdated += batchResult.entitiesUpdated;
    currentImport = batchResult.csvImport;
    totalFailures += batchResult.rowErrorsCount;
    consecutiveFailures = batchResult.endConsecutiveFailures;
    // eslint-disable-next-line no-await-in-loop
    await Promise.resolve(
      callbacks.onProgress({
        importId: context.csvImport.id,
        processedRows,
        totalRows,
        batchIndex,
        batchCount,
        entitiesCreatedInBatch: batchResult.entitiesCreated,
        entitiesUpdatedInBatch: batchResult.entitiesUpdated,
      })
    );

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
        entitiesUpdated,
        processedRows,
        csvImport: currentImport,
        shouldStop: true,
        cancelled: false,
        stopReason: stopDecision.reason,
      };
    }
  }

  return {
    entitiesCreated,
    entitiesUpdated,
    processedRows,
    csvImport: currentImport,
    shouldStop: false,
    cancelled: false,
  };
};

export { processImportRows };
