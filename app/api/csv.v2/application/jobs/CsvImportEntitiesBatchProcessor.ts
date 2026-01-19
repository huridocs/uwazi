import { TransactionManager } from 'api/core/application/contracts/TransactionManager';
import { Entity } from 'api/core/domain/entity/Entity';
import { Template } from 'api/core/domain/template/Template';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { CsvImport, CsvImportDomain } from '../../domain/CsvImport';
import { CsvImportRow } from '../../domain/CsvImportRow';
import { CsvImportRowError } from '../../domain/CsvImportRowError';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource';
import { CsvImportRowErrorsDataSource } from '../contracts/CsvImportRowErrorsDataSource';
import { CsvHeaderAnalyzer } from '../services/CsvHeaderAnalyzer';
import {
  AppliedValueIndex,
  CsvEntitiesImportMapper,
  MappedAssignment,
} from '../services/CsvEntitiesImportMapper';

type BatchContext = {
  csvImport: CsvImport;
  template: Template;
  languages: LanguageISO6391[];
  defaultLanguage: LanguageISO6391;
  dateFormat?: string;
  thesaurusIndex: AppliedValueIndex;
  sanitizedHeaders: string[];
  headerAnalysis: ReturnType<typeof CsvHeaderAnalyzer.analyze>;
};

type BatchDeps = {
  entitiesDS: MultiLanguageEntityDataSource;
  csvImportsDS: CsvImportsDataSource;
  rowErrorsDS: CsvImportRowErrorsDataSource;
  transactionManager: TransactionManager;
};

const buildEntityFromRow = (context: BatchContext, rowValues: string[]) => {
  const {
    template,
    languages,
    defaultLanguage,
    dateFormat,
    thesaurusIndex,
    sanitizedHeaders,
    headerAnalysis,
    csvImport,
  } = context;

  const assignments = CsvEntitiesImportMapper.buildPropertyAssignments({
    template,
    headerAnalysis,
    sanitizedHeaders,
    rowValues,
    thesaurusIndex,
    languages,
    defaultLanguage,
    dateFormat,
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

const processAndPersistRow = async (
  deps: BatchDeps,
  context: BatchContext,
  rowValues: string[]
) => {
  const entity = buildEntityFromRow(context, rowValues);
  await deps.entitiesDS.create(entity);
};

const processImportBatch = async (params: {
  deps: BatchDeps;
  context: BatchContext;
  rows: CsvImportRow[];
  offset: number;
  totalRows: number;
  processedRows: number;
  batchSize: number;
  csvImport: CsvImport;
}): Promise<{
  entitiesCreated: number;
  processedRows: number;
  csvImport: CsvImport;
  rowErrorsCount: number;
  endConsecutiveFailures: number;
  maxConsecutiveFailures: number;
}> => {
  const { deps, context, rows, offset, totalRows, processedRows, batchSize, csvImport } = params;
  const batchLastIndex = offset + rows.length - 1;
  const progress = {
    totalRows,
    processedRows: processedRows + rows.length,
    lastProcessedRow: batchLastIndex,
    batchSize,
  };
  const updatedImport = CsvImportDomain.withProgress(csvImport, progress);
  const entitiesCreated = await deps.transactionManager.run(async () => {
    const errors: CsvImportRowError[] = [];
    let created = 0;
    let consecutiveFailures = 0;
    let maxConsecutiveFailures = 0;
    for (const row of rows) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await processAndPersistRow(deps, context, row.values);
        created += 1;
        consecutiveFailures = 0;
      } catch (error) {
        errors.push(
          CsvImportRowError.create({
            importId: csvImport.id,
            rowIndex: row.index,
            message: (error as Error).message,
          })
        );
        consecutiveFailures += 1;
        if (consecutiveFailures > maxConsecutiveFailures) {
          maxConsecutiveFailures = consecutiveFailures;
        }
      }
    }
    await deps.csvImportsDS.update(updatedImport);
    await deps.rowErrorsDS.insertMany(errors);
    return {
      created,
      rowErrorsCount: errors.length,
      endConsecutiveFailures: consecutiveFailures,
      maxConsecutiveFailures,
    };
  });
  return {
    entitiesCreated: entitiesCreated.created,
    processedRows: progress.processedRows,
    csvImport: updatedImport,
    rowErrorsCount: entitiesCreated.rowErrorsCount,
    endConsecutiveFailures: entitiesCreated.endConsecutiveFailures,
    maxConsecutiveFailures: entitiesCreated.maxConsecutiveFailures,
  };
};

export type { BatchContext };
export { processImportBatch };
