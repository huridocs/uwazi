import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { CsvImport } from '../../domain/CsvImport.js';
import { CsvHeaderAnalyzer } from '../services/CsvHeaderAnalyzer.js';
import { CsvEntitiesImportMapper } from '../services/CsvEntitiesImportMapper.js';
import { Callbacks as BaseCallbacks } from './types/UseCaseCallbacks.js';
import { BatchContext } from './CsvImportEntitiesBatchProcessor.js';

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

type ImportContext = BatchContext & {
  csvImport: CsvImport;
  languages: LanguageISO6391[];
  totalRows: number;
  thesaurusIndex: Awaited<ReturnType<CsvEntitiesImportMapper['buildAppliedValuesIndex']>>;
  relationshipIndex: Awaited<ReturnType<CsvEntitiesImportMapper['buildRelationshipValuesIndex']>>;
  sanitizedHeaders: string[];
  headerAnalysis: ReturnType<typeof CsvHeaderAnalyzer.analyze>;
};

export type { Callbacks, ImportContext };
