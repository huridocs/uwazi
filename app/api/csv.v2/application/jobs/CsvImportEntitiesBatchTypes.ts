import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FilesDataSource } from '#api/core/application/contracts/FilesDataSource.js';
import { EntitiesService } from '#api/core/application/EntitiesService.js';
import { FilesService } from '#api/core/application/FilesService.js';
import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { EntitiesDataSource } from '#api/core/application/contracts/EntitiesDataSource.js';
import { Template } from '#api/core/domain/template/Template.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { CsvImport } from '../../domain/CsvImport.js';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource.js';
import { CsvImportRowErrorsDataSource } from '../contracts/CsvImportRowErrorsDataSource.js';
import { AppliedValueIndex, CsvEntitiesImportMapper } from '../services/CsvEntitiesImportMapper.js';
import { CsvHeaderAnalyzer } from '../services/CsvHeaderAnalyzer.js';

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
  entitiesDS: EntitiesDataSource;
  filesDS: FilesDataSource;
  csvImportsDS: CsvImportsDataSource;
  rowErrorsDS: CsvImportRowErrorsDataSource;
  transactionManager: TransactionManager;
  propertyAssignmentCreatorServiceStrategy: PropertyAssignmentCreatorServiceStrategy;
  filesService: FilesService;
  fileStorage: FileStorage;
  idGenerator: IdGenerator;
};

type InsertContext = { tenantName: string; actorId: string; targetLanguage: LanguageISO6391 };

export type { BatchContext, BatchDeps, InsertContext };
