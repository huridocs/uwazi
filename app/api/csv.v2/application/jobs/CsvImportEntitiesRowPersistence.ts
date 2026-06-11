import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import { PropertyAssignment } from '#api/core/domain/template/PropertyValue.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { CsvImport } from '../../domain/CsvImport.js';
import { CsvImportEntityNotFoundInTemplateError } from '../services/CsvImportRowProcessingError.js';
import { BatchContext, BatchDeps, InsertContext } from './CsvImportEntitiesBatchTypes.js';
import { prepareRowImport } from './CsvImportEntitiesRowPreparation.js';

const toEntityFiles = (params: {
  files: Awaited<ReturnType<typeof prepareRowImport>>['files'];
  sharedId: string;
  idGenerator: IdGenerator;
}) =>
  [...params.files.documents, ...params.files.attachments].map(inputFile =>
    inputFile.toEntityFile(params.sharedId, params.idGenerator.generate())
  );

const normalizeFileOriginalName = (filename: string) => filename.trim().toLowerCase();

const filterFilesToAppend = (params: { existingFiles: BaseFile[]; entityFiles: BaseFile[] }) => {
  const knownNames = new Set(
    params.existingFiles
      .map(file => file.originalname)
      .filter(Boolean)
      .map(normalizeFileOriginalName)
  );
  const filesToInsert: BaseFile[] = [];

  params.entityFiles.forEach(file => {
    const normalized = normalizeFileOriginalName(file.originalname);
    if (knownNames.has(normalized)) return;
    knownNames.add(normalized);
    filesToInsert.push(file);
  });

  return filesToInsert;
};

const createEntityForImportRow = async (params: {
  deps: BatchDeps;
  context: BatchContext;
  propertyAssignments: PropertyAssignment[];
  files: Awaited<ReturnType<typeof prepareRowImport>>['files'];
  insertContext: InsertContext;
  updatedImport: CsvImport;
}) => {
  const entity = Entity.create({
    languages: params.context.languages,
    template: params.context.template,
    userId: params.context.csvImport.createdBy,
  });
  entity.setPropertyAssignmentsInAllLanguages(params.propertyAssignments, false);
  const entityFiles = toEntityFiles({
    files: params.files,
    sharedId: entity.sharedId,
    idGenerator: params.deps.idGenerator,
  });
  await params.deps.filesService.storeFiles(entityFiles);

  await params.deps.transactionManager.run(async () => {
    await params.deps.entitiesService.insert(entity, params.insertContext);
    await params.deps.filesService.insert(entityFiles);
    await params.deps.csvImportsDS.update(params.updatedImport);
  });
};

const updateEntityForImportRow = async (params: {
  deps: BatchDeps;
  context: BatchContext;
  rowId: string;
  propertyAssignments: PropertyAssignment[];
  files: Awaited<ReturnType<typeof prepareRowImport>>['files'];
  insertContext: { actorId: string; targetLanguage: LanguageISO6391 };
  updatedImport: CsvImport;
}) => {
  const existsInTemplate = await params.deps.entitiesDS.existsByIdAndTemplateId(
    params.rowId,
    params.context.template.id
  );
  if (!existsInTemplate) {
    throw new CsvImportEntityNotFoundInTemplateError({
      sharedId: params.rowId,
      templateId: params.context.template.id,
    });
  }

  const entity = (await params.deps.entitiesDS.getById(params.rowId)).getDataOrThrow();
  entity.setPropertyAssignmentsInAllLanguages(
    Object.values(entity.template.createDefaultPropertyAssignments()),
    false
  );
  entity.setPropertyAssignmentsInAllLanguages(params.propertyAssignments, false);

  const entityFiles = toEntityFiles({
    files: params.files,
    sharedId: entity.sharedId,
    idGenerator: params.deps.idGenerator,
  });
  const filesToInsert = filterFilesToAppend({
    existingFiles: await params.deps.filesDS.getByEntitiesIds([entity.sharedId]).all(),
    entityFiles,
  });
  await params.deps.filesService.storeFiles(filesToInsert);

  await params.deps.transactionManager.run(async () => {
    await params.deps.entitiesService.update(entity, {
      actorId: params.insertContext.actorId,
      targetLanguage: params.insertContext.targetLanguage,
    });
    await params.deps.filesService.insert(filesToInsert);
    await params.deps.csvImportsDS.update(params.updatedImport);
  });
};

export { createEntityForImportRow, updateEntityForImportRow };
