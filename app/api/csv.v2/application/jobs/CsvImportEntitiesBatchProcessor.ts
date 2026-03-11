import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { Template } from '#api/core/domain/template/Template.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FilesService } from '#api/core/application/FilesService.js';
import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { CsvImport, CsvImportDomain } from '../../domain/CsvImport.js';
import { CsvImportRow } from '../../domain/CsvImportRow.js';
import { CsvImportRowError } from '../../domain/CsvImportRowError.js';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource.js';
import { CsvImportRowErrorsDataSource } from '../contracts/CsvImportRowErrorsDataSource.js';
import { CsvHeaderAnalyzer } from '../services/CsvHeaderAnalyzer.js';
import { AppliedValueIndex, CsvEntitiesImportMapper } from '../services/CsvEntitiesImportMapper.js';
import { CsvImportRowFilesResolver } from '../services/CsvImportRowFilesResolver.js';

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
  entitiesDS: MultiLanguageEntityDataSource;
  csvImportsDS: CsvImportsDataSource;
  rowErrorsDS: CsvImportRowErrorsDataSource;
  transactionManager: TransactionManager;
  propertyAssignmentCreatorServiceStrategy: PropertyAssignmentCreatorServiceStrategy;
  filesService: FilesService;
  fileStorage: FileStorage;
  idGenerator: IdGenerator;
};

const buildEntityFromRow = (context: BatchContext) => {
  const { template, languages, csvImport } = context;
  const entity = Entity.create({
    languages,
    template,
    userId: csvImport.createdBy,
  });
  return entity;
};

const prepareRowImport = async (deps: BatchDeps, context: BatchContext, rowValues: string[]) => {
  const files = await CsvImportRowFilesResolver.resolve({
    importId: context.csvImport.id,
    rowValues,
    sanitizedHeaders: context.sanitizedHeaders,
    headerAnalysis: context.headerAnalysis,
    fileStorage: deps.fileStorage,
  });

  const attachmentLookup = (filename: string) => {
    if (!filename) {
      return undefined;
    }
    const normalized = filename.trim();
    if (!normalized) {
      return undefined;
    }
    if (!files.attachmentFilenameByOriginalName.has(normalized)) {
      return undefined;
    }
    const index = files.attachments.findIndex(
      attachment => attachment.metadata.originalname === normalized
    );
    return index >= 0 ? index : undefined;
  };

  const assignments = CsvEntitiesImportMapper.buildPropertyAssignments({
    template: context.template,
    headerAnalysis: context.headerAnalysis,
    sanitizedHeaders: context.sanitizedHeaders,
    rowValues,
    thesaurusIndex: context.thesaurusIndex,
    relationshipIndex: context.relationshipIndex,
    languages: context.languages,
    defaultLanguage: context.defaultLanguage,
    dateFormat: context.dateFormat,
    attachmentLookup,
  });

  const propertyAssignments = await deps.propertyAssignmentCreatorServiceStrategy.bulkCreate(
    assignments,
    context.template,
    files.attachments
  );

  const entity = buildEntityFromRow(context);
  entity.setPropertyAssignmentsInAllLanguages(propertyAssignments, false);

  const entityFiles = [...files.documents, ...files.attachments].map(inputFile =>
    inputFile.toEntityFile(entity.sharedId, deps.idGenerator.generate())
  );

  await deps.filesService.storeFiles(entityFiles);
  return { entity, entityFiles };
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
  const errors: CsvImportRowError[] = [];
  let created = 0;
  let consecutiveFailures = 0;
  let maxConsecutiveFailures = 0;

  for (const row of rows) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const { entity, entityFiles } = await prepareRowImport(deps, context, row.values);
      // eslint-disable-next-line no-await-in-loop
      await deps.transactionManager.run(async () => {
        await deps.entitiesDS.create(entity);
        await deps.filesService.insert(entityFiles);
      });
      created += 1;
      consecutiveFailures = 0;
    } catch (error) {
      errors.push(
        CsvImportRowError.create({
          importId: csvImport.id,
          rowIndex: row.rowIndex,
          message: (error as Error).message,
        })
      );
      consecutiveFailures += 1;
      if (consecutiveFailures > maxConsecutiveFailures) {
        maxConsecutiveFailures = consecutiveFailures;
      }
    }
  }

  const entitiesCreated = await deps.transactionManager.run(async () => {
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
