import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { Template } from '#api/core/domain/template/Template.js';
import { PropertyAssignment } from '#api/core/domain/template/PropertyValue.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { CsvImportRowFilesResolver } from '../services/CsvImportRowFilesResolver.js';
import { CsvEntitiesImportMapper } from '../services/CsvEntitiesImportMapper.js';
import { CsvHeaderAnalyzer } from '../services/CsvHeaderAnalyzer.js';
import { CsvImportRowEmptyError } from '../services/CsvImportRowProcessingError.js';
import { createPropertyAssignments, isEmptyRow } from './CsvImportEntitiesPropertyAssignments.js';

type RowFiles = Awaited<ReturnType<typeof CsvImportRowFilesResolver.resolve>>;

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
  importId: string;
  rowValues: string[];
  sanitizedHeaders: string[];
  headerAnalysis: ReturnType<typeof CsvHeaderAnalyzer.analyze>;
  template: Template;
  thesaurusIndex: Awaited<ReturnType<CsvEntitiesImportMapper['buildAppliedValuesIndex']>>;
  relationshipIndex: Awaited<ReturnType<CsvEntitiesImportMapper['buildRelationshipValuesIndex']>>;
  languages: LanguageISO6391[];
  defaultLanguage: LanguageISO6391;
  dateFormat?: string;
  fileStorage: FileStorage;
  propertyAssignmentCreatorServiceStrategy: PropertyAssignmentCreatorServiceStrategy;
}): Promise<{ propertyAssignments: PropertyAssignment[]; files: RowFiles }> => {
  if (isEmptyRow(params.rowValues)) {
    throw new CsvImportRowEmptyError();
  }

  const files = await CsvImportRowFilesResolver.resolve({
    importId: params.importId,
    rowValues: params.rowValues,
    sanitizedHeaders: params.sanitizedHeaders,
    headerAnalysis: params.headerAnalysis,
    fileStorage: params.fileStorage,
  });

  const assignments = CsvEntitiesImportMapper.buildPropertyAssignments({
    template: params.template,
    headerAnalysis: params.headerAnalysis,
    sanitizedHeaders: params.sanitizedHeaders,
    rowValues: params.rowValues,
    thesaurusIndex: params.thesaurusIndex,
    relationshipIndex: params.relationshipIndex,
    languages: params.languages,
    defaultLanguage: params.defaultLanguage,
    dateFormat: params.dateFormat,
    attachmentLookup: createAttachmentLookup(files),
  });

  const propertyAssignments = await createPropertyAssignments({
    propertyAssignmentCreatorServiceStrategy: params.propertyAssignmentCreatorServiceStrategy,
    template: params.template,
    assignments,
    sanitizedHeaders: params.sanitizedHeaders,
    rowValues: params.rowValues,
    attachments: files.attachments,
  });

  return { propertyAssignments, files };
};

const getRowValueByHeader = (
  rowValues: string[],
  sanitizedHeaders: string[],
  headerName: string
): string | undefined => {
  const index = sanitizedHeaders.findIndex(header => header === headerName);
  if (index < 0) return undefined;
  const value = rowValues[index]?.trim();
  return value || undefined;
};

export { prepareRowImport, getRowValueByHeader };
