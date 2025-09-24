/* eslint-disable max-lines */
/* eslint-disable max-statements */
/* eslint-disable max-classes-per-file */
/* eslint-disable camelcase */
import moment from 'moment';
import {
  ExtractedMetadataSchema,
  LanguageISO6391,
  ObjectIdSchema,
  PropertyTypeSchema,
  
} from 'shared/types/commonTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../files/filesModel.js' or its... Remove this comment to see the full error message
import { filesModel } from '../files/filesModel.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/segmentatio... Remove this comment to see the full error message
import { SegmentationType } from 'shared/types/segmentationType.js';
// @ts-expect-error TS(2307): Cannot find module '../entities/entitiesModel.js' ... Remove this comment to see the full error message
import entitiesModel from '../entities/entitiesModel.js';
// @ts-expect-error TS(2307): Cannot find module '../services/pdfsegmentation/se... Remove this comment to see the full error message
import { SegmentationModel } from '../services/pdfsegmentation/segmentationModel.js';
// @ts-expect-error TS(2307): Cannot find module '../suggestions/IXSuggestionsMo... Remove this comment to see the full error message
import { IXSuggestionsModel } from '../suggestions/IXSuggestionsModel.js';
// @ts-expect-error TS(2307): Cannot find module '../services/informationextract... Remove this comment to see the full error message
import ixmodels from '../services/informationextraction/ixmodels.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/fileType.js... Remove this comment to see the full error message
import { FileType } from 'shared/types/fileType.js';
// @ts-expect-error TS(2307): Cannot find module '../templates/templates.js' or ... Remove this comment to see the full error message
import templatesModel from '../templates/templates.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/propertyTypes.js'... Remove this comment to see the full error message
import { propertyTypes } from 'shared/propertyTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/tsUtils.js' or it... Remove this comment to see the full error message
import { ensure } from 'shared/tsUtils.js';

import { EnforcedWithId, UwaziFilterQuery } from '../odm/index.js';
// @ts-expect-error TS(2307): Cannot find module '../entities.v2/model/Entity.js... Remove this comment to see the full error message
import { Entity } from '../entities.v2/model/Entity.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/IXModelType... Remove this comment to see the full error message
import { IXModelType } from 'shared/types/IXModelType.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/suggestionT... Remove this comment to see the full error message
import { IXSuggestionType } from 'shared/types/suggestionType.js';
// @ts-expect-error TS(2307): Cannot find module '../suggestions/queryBuilder.js... Remove this comment to see the full error message
import { PipelineBuilder } from '../suggestions/queryBuilder.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/extractorTy... Remove this comment to see the full error message
import { IXExtractorType } from 'shared/types/extractorType.js';
import { ObjectId } from 'mongodb';
// @ts-expect-error TS(2307): Cannot find module '../suggestions/suggestions.js'... Remove this comment to see the full error message
import { Suggestions } from '../suggestions/suggestions.js';
import { Extractors } from './ixextractors.js';
import { IXServices } from './IXServices.js';

const BATCH_SIZE_FOR_PDF = 50;
const BATCH_SIZE_FOR_PROPERTY = 1000;
const MAX_TRAINING_FILES_NUMBER = 2000;
const MAX_TRAINING_ENTITIES_NUMBER = 15000;

type PropertyValue = string | Array<{ value: string; label: string }>;

class NoSegmentedFiles extends Error {
  static defaultMessage = 'There are no Segments for training the model';

  constructor(message = NoSegmentedFiles.defaultMessage) {
    super(message);
  }
}

class NoLabeledEntities extends Error {
  static defaultMessage = 'There are no labeled Files for training the model';

  constructor(message = NoLabeledEntities.defaultMessage) {
    super(message);
  }
}

class NoFilesForTraining extends Error {
  static defaultMessage = 'There are no labeled Files for training the model';

  constructor(message = NoFilesForTraining.defaultMessage) {
    super(message);
  }
}

interface FileWithAggregation {
  _id: ObjectIdSchema;
  segmentation: SegmentationType;
  entity: string;
  language: string;
  extractedMetadata: ExtractedMetadataSchema[];
  propertyType: PropertyTypeSchema;
  propertyValue?: PropertyValue;
}

type FileEnforcedNotUndefined = {
  _id: ObjectIdSchema;
  filename: string;
  language: string;
  entity: string;
  propertyType: PropertyTypeSchema;
  propertyValue?: PropertyValue;
};

const selectProperties: Set<string> = new Set([propertyTypes.select, propertyTypes.multiselect]);
const propertiesWithoutExtractedMetadata: Set<string> = new Set([
  ...Array.from(selectProperties),
  propertyTypes.relationship,
]);
const multiValuedProperties: Set<string> = new Set([
  propertyTypes.multiselect,
  propertyTypes.relationship,
]);

const propertyTypeIsSelectOrMultiSelect = (type: string) => selectProperties.has(type);

const propertyTypeIsWithoutExtractedMetadata = (type: string) =>
  propertiesWithoutExtractedMetadata.has(type);

const propertyTypeIsMultiValued = (type: string) => multiValuedProperties.has(type);

async function getFilesWithAggregations(files: (FileType & FileEnforcedNotUndefined)[]) {
  const filesNames = files.filter(x => x.filename).map(x => x.filename);

  const segmentationForFiles = (await SegmentationModel.get(
    { filename: { $in: filesNames }, status: 'ready' },
    'filename segmentation xmlname status'
  )) as (SegmentationType & { filename: string })[];

  const segmentationDictionary = Object.assign(
    {},
    ...segmentationForFiles.map(segmentation => ({ [segmentation.filename]: segmentation }))
  );

  return files.map(file => ({
    _id: file._id,
    language: file.language,
    extractedMetadata: file.extractedMetadata ? file.extractedMetadata : [],
    entity: file.entity,
    segmentation: segmentationDictionary[file.filename ? file.filename : 'no value'],
    propertyType: file.propertyType,
    propertyValue: file.propertyValue,
  }));
}

async function getSegmentedFilesIds() {
  const segmentations = await SegmentationModel.get({ status: 'ready' }, 'fileID');
  // @ts-expect-error TS(7006): Parameter 'x' implicitly has an 'any' type.
  const result = segmentations.filter(x => x.fileID).map(x => x.fileID) as ObjectIdSchema[];
  return result;
}

async function getPropertyType(templates: ObjectIdSchema[], property: string) {
  const template = await templatesModel.getById(templates[0]);

  let type: PropertyTypeSchema | undefined = 'text';
  if (property !== 'title') {
    // @ts-expect-error TS(7006): Parameter 'p' implicitly has an 'any' type.
    const prop = template?.properties?.find(p => p.name === property);
    type = prop?.type;
  }

  if (!type) {
    throw new Error(`Property "${property}" does not exists`);
  }

  return type;
}

function entityForTrainingQuery(
  templates: ObjectIdSchema[],
  toProperty: string,
  fromProperty?: string
): UwaziFilterQuery<Entity> {
  const query: UwaziFilterQuery<any> = { template: { $in: templates } };

  if (fromProperty) {
    // This new logic is not tested
    if (fromProperty === 'title') {
      query.title = { $ne: '' };
    } else {
      query[`metadata.${fromProperty}`] = { $exists: true, $ne: [] };
    }
  }

  if (toProperty === 'title') {
    query.title = { $ne: '' };
  } else {
    query[`metadata.${toProperty}`] = {
      $exists: true,
      $not: { $eq: [] },
      $elemMatch: {
        value: {
          $exists: true,
          $nin: ['', null, undefined],
        },
      },
    };
  }

  return query;
}

async function getEntitiesForTraining(
  templates: ObjectIdSchema[],
  toProperty: string,
  fromProperty: string
) {
  const entities = await entitiesModel.getUnrestricted(
    entityForTrainingQuery(templates, toProperty, fromProperty),
    `sharedId title metadata.${toProperty} metadata.${fromProperty} language`,
    {
      limit: MAX_TRAINING_ENTITIES_NUMBER,
    }
  );
  return entities;
}

async function getEntitiesForIdsQuery(model: EnforcedWithId<IXModelType>, BATCH_SIZE: number) {
  const runIds = model.processRun?.findSuggestionsSharedIds as string[] | undefined;
  if (!runIds?.length) {
    await ixmodels.unsetFindSuggestionsData(model._id);
    return null;
  }

  const sharedIdsToProcess = runIds.slice(0, BATCH_SIZE);

  await ixmodels.updateMany(
    { _id: model._id },
    { $set: { 'processRun.findSuggestionsSharedIds': runIds.slice(BATCH_SIZE) } }
  );

  const entityQuery = { sharedId: { $in: sharedIdsToProcess } };

  return entityQuery;
}

async function getEntitiesForSuggestionsQuery(
  extractorId: ObjectIdSchema,
  model: EnforcedWithId<IXModelType>,
  BATCH_SIZE: number
) {
  // Use process-aware sampling when filters are set; otherwise balanced sampling
  const suggestions = await Suggestions.getSampleForProcess(extractorId, model, BATCH_SIZE);

  if (!suggestions.length) {
    return null;
  }

  // Build an OR of exact (sharedId, language) pairs to avoid cross-product expansion
  const uniquePairs = Array.from(
    // @ts-expect-error TS(7006): Parameter 's' implicitly has an 'any' type.
    new Set(suggestions.map(s => `${s.entityId}::${s.language || ''}`))
  )
    .map(key => {
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      const [sharedId, language] = key.split('::');
      return { sharedId, language } as { sharedId: string; language: string };
    })
    .filter(p => p.sharedId && p.language);

  const entityQuery = { $or: uniquePairs } as UwaziFilterQuery<any>;

  return entityQuery;
}

async function getEntitiesForSuggestions(extractorId: ObjectIdSchema, limit?: number) {
  const [[model], [extractor]] = await Promise.all([
    ixmodels.get({ extractorId }),
    Extractors.get({ _id: extractorId }),
  ]);

  if (!extractor?.property) {
    return [];
  }

  // Validate that the property exists in the template (throws if not found)
  await getPropertyType(extractor.templates, extractor.property);

  const BATCH_SIZE = typeof limit === 'number' ? limit : BATCH_SIZE_FOR_PROPERTY;

  // In process_selected, if the selected queue is empty (after trimming), do not sample.
  // End the find phase immediately.
  const isSelectedMode = model.processRun?.mode === 'process_selected';
  const hasSelectedQueue = Array.isArray(model.processRun?.findSuggestionsSharedIds)
    ? model.processRun!.findSuggestionsSharedIds!.length > 0
    : false;
  if (isSelectedMode && !hasSelectedQueue) {
    return [];
  }

  let entityQuery: UwaziFilterQuery<any> | null = {};

  if (model.processRun?.findSuggestionsSharedIds?.length) {
    entityQuery = await getEntitiesForIdsQuery(model, BATCH_SIZE);
  } else {
    entityQuery = await getEntitiesForSuggestionsQuery(extractorId, model, BATCH_SIZE);
  }

  if (!entityQuery) {
    return [];
  }

  const projection = new Set([
    'sharedId',
    'title',
    `metadata.${extractor.property}`,
    'language',
    `metadata.${extractor.source.property}`,
  ]);

  const entities = await entitiesModel.getUnrestricted(
    entityQuery,
    Array.from(projection).join(' ')
  );

  return entities;
}

async function getFilesForTraining(extractor: IXExtractorType) {
  const pipeline = new PipelineBuilder();
  pipeline.add({
    $match: {
      extractorId: extractor._id,
      currentValue: { $nin: ['', null, undefined], $ne: [] },
    },
  });
  pipeline.add({ $limit: MAX_TRAINING_FILES_NUMBER });

  pipeline.add({
    $lookup: {
      from: 'entities',
      localField: 'entityLanguageId',
      foreignField: '_id',
      as: 'entityLanguage',
      pipeline: [
        {
          $project: {
            metadata: `$metadata.${extractor.property}`,
          },
        },
      ],
    },
  });
  pipeline.add({
    $unwind: '$entityLanguage',
  });

  pipeline.add({
    $lookup: {
      from: 'files',
      localField: 'fileId',
      foreignField: '_id',
      as: 'file',
      pipeline: [
        { $match: { status: 'ready' } },
        {
          $project: {
            extractedMetadata: {
              $filter: {
                input: '$extractedMetadata',
                as: 'item',
                cond: { $eq: ['$$item.name', extractor.property] },
              },
            },
            filename: 1,
          },
        },
      ],
    },
  });
  pipeline.add({
    $unwind: '$file',
  });

  pipeline.add({
    $lookup: {
      from: 'segmentations',
      localField: 'fileId',
      foreignField: 'fileID',
      as: 'segmentation',
      pipeline: [
        { $match: { status: 'ready' } },
        { $project: { extractedMetadata: 1, filename: 1, xmlname: 1, segmentation: 1 } },
      ],
    },
  });
  pipeline.add({
    $unwind: '$segmentation',
  });

  const targetProperty = await IXServices.getTargetProperty({ extractor });
  const cursor = IXSuggestionsModel.db.aggregateCursor(pipeline.build()).cursor();

  const process = async (
    callback: (item: {
      _id: ObjectId;
      language: LanguageISO6391;
      extractedMetadata: any;
      entity: string;
      segmentation: any;
      propertyValue: any;
      propertyType: PropertyTypeSchema;
    }) => Promise<void>
  ) => {
    await cursor.eachAsync(
      // @ts-expect-error TS(7031): Binding element 'fileId' implicitly has an 'any' t... Remove this comment to see the full error message
      async ({ fileId, language, file, entityId, entityLanguage, segmentation, currentValue }) => {
        let propertyValue;

        if (propertyTypeIsWithoutExtractedMetadata(targetProperty.type)) {
          propertyValue = entityLanguage.metadata.map(({ value, label }: any) => ({
            value: ensure<string>(value),
            label: ensure<string>(label),
          }));
        } else {
          propertyValue = currentValue.toString();

          if (targetProperty.type === 'date') {
            propertyValue = moment(currentValue * 1000)
              .utc()
              .format('YYYY-MM-DD');
          }
        }
        const parsed = {
          _id: fileId,
          language,
          extractedMetadata: file?.extractedMetadata || [],
          entity: entityId,
          segmentation,
          propertyValue,
          propertyType: targetProperty.type,
        };

        await callback(parsed);
      }
    );
  };

  return { process };
}

async function getFileIdsWithReadySegmentations(
  extractorId: ObjectIdSchema,
  limit: number
): Promise<ObjectIdSchema[]> {
  const [currentModel] = await ixmodels.get({ extractorId });
  const targetLimit = typeof limit === 'number' ? limit : BATCH_SIZE_FOR_PDF;

  // Use process-aware sampling when filters are set; otherwise balanced sampling
  // Get extra suggestions since some might have failed segmentations
  const suggestions = await Suggestions.getSampleForProcess(
    extractorId,
    currentModel,
    targetLimit * 3
  );

  if (!suggestions.length) {
    return [];
  }

  const readyLabeledFileIds: ObjectIdSchema[] = [];
  const readyUnlabeledFileIds: ObjectIdSchema[] = [];
  const suggestionsWithFailedSegmentations: IXSuggestionType[] = [];

  // Process suggestions in batches to check segmentation status (keep existing batching logic)
  const batchSize = 100;
  let suggestionIndex = 0;

  while (
    suggestionIndex < suggestions.length &&
    readyLabeledFileIds.length + readyUnlabeledFileIds.length < targetLimit
  ) {
    const currentBatch = suggestions.slice(suggestionIndex, suggestionIndex + batchSize);

    if (!currentBatch.length) {
      break;
    }

    // @ts-expect-error TS(7006): Parameter 's' implicitly has an 'any' type.
    const fileIds = currentBatch.map(s => s.fileId).filter((id): id is ObjectIdSchema => !!id);

    if (fileIds.length > 0) {
      // eslint-disable-next-line no-await-in-loop
      const segmentations = await SegmentationModel.get(
        { fileID: { $in: fileIds } },
        'fileID status'
      );

      const readySegmentationFileIds = segmentations
        // @ts-expect-error TS(7006): Parameter 'seg' implicitly has an 'any' type.
        .filter(seg => seg.status === 'ready')
        // @ts-expect-error TS(7006): Parameter 'seg' implicitly has an 'any' type.
        .map(seg => seg.fileID!);

      const failedSegmentationFileIds = segmentations
        // @ts-expect-error TS(7006): Parameter 'seg' implicitly has an 'any' type.
        .filter(seg => seg.status === 'failed')
        // @ts-expect-error TS(7006): Parameter 'seg' implicitly has an 'any' type.
        .map(seg => seg.fileID!);

      // @ts-expect-error TS(7006): Parameter 's' implicitly has an 'any' type.
      const failedSuggestions = currentBatch.filter(s =>
        // @ts-expect-error TS(7006): Parameter 'failedId' implicitly has an 'any' type.
        failedSegmentationFileIds.some(failedId => failedId.toString() === s.fileId?.toString())
      );
      // Partition ready fileIds into labeled / unlabeled buckets preserving insertion order
      // @ts-expect-error TS(7006): Parameter 'id' implicitly has an 'any' type.
      const readySet = new Set(readySegmentationFileIds.map(id => id.toString()));
      // @ts-expect-error TS(7006): Parameter 's' implicitly has an 'any' type.
      currentBatch.forEach(s => {
        const fId = s.fileId as ObjectIdSchema | undefined;
        if (!fId) return;
        if (!readySet.has(fId.toString())) return;
        const isLabeled = !!s.state?.labeled;
        if (isLabeled) {
          if (!readyLabeledFileIds.some(x => x.toString() === fId.toString())) {
            readyLabeledFileIds.push(fId);
          }
        } else if (!readyUnlabeledFileIds.some(x => x.toString() === fId.toString())) {
          readyUnlabeledFileIds.push(fId);
        }
      });
      suggestionsWithFailedSegmentations.push(...failedSuggestions);
    }

    suggestionIndex += batchSize;
  }

  // Keep ALL existing error handling logic unchanged
  if (suggestionsWithFailedSegmentations.length) {
    const modifiedSuggestions = suggestionsWithFailedSegmentations.map(suggestion => ({
      ...suggestion,
      state: {
        ...suggestion.state,
        error: true,
        obsolete: false,
      },
      status: 'failed' as IXSuggestionType['status'],
    })) as Partial<IXSuggestionType>[];

    await IXSuggestionsModel.saveMultiple(modifiedSuggestions);
  }

  // Balance selection: take up to half from each bucket, then fill the remainder
  const idealHalf = Math.floor(targetLimit / 2);
  const chosen: ObjectIdSchema[] = [];

  const takeFrom = (arr: ObjectIdSchema[], count: number) => {
    for (let i = 0; i < arr.length && chosen.length < count; i += 1) {
      const id = arr[i];
      if (!chosen.some(x => x.toString() === id.toString())) {
        chosen.push(id);
      }
    }
  };

  const firstLabeled = Math.min(idealHalf, readyLabeledFileIds.length);
  const firstUnlabeled = Math.min(idealHalf, readyUnlabeledFileIds.length);
  takeFrom(readyLabeledFileIds, firstLabeled);
  takeFrom(readyUnlabeledFileIds, firstUnlabeled + firstLabeled);

  // Fill remainder from either side until reaching targetLimit
  const fillTarget = targetLimit;
  if (chosen.length < fillTarget) takeFrom(readyLabeledFileIds, fillTarget);
  if (chosen.length < fillTarget) takeFrom(readyUnlabeledFileIds, fillTarget);

  return chosen.slice(0, targetLimit);
}

function createBaseFileQuery() {
  return {
    type: 'document' as const,
    filename: { $exists: true },
    language: { $exists: true },
  };
}

async function filterFileIdsByReadySegmentations(
  fileIds: ObjectIdSchema[]
): Promise<ObjectIdSchema[]> {
  if (!fileIds.length) return [];

  const segmentations = await SegmentationModel.get(
    { fileID: { $in: fileIds }, status: 'ready' },
    'fileID'
  );

  // @ts-expect-error TS(7006): Parameter 's' implicitly has an 'any' type.
  return segmentations.map(s => s.fileID!);
}

function createFilesQueryByIds(fileIds: ObjectIdSchema[]) {
  return {
    _id: { $in: fileIds },
    ...createBaseFileQuery(),
  };
}

function createFilesQueryByEntities(entityIds: string[]) {
  return {
    entity: { $in: entityIds },
    ...createBaseFileQuery(),
  };
}

async function getNextSharedIdsBatch(
  model: EnforcedWithId<IXModelType>,
  batchSize: number
): Promise<string[] | null> {
  const runIds = model.processRun?.findSuggestionsSharedIds || [];
  if (!runIds.length) {
    await ixmodels.unsetFindSuggestionsData(model._id);
    return null;
  }

  const sharedIdsToProcess = runIds.slice(0, batchSize);

  await ixmodels.updateMany(
    { _id: model._id },
    { $set: { 'processRun.findSuggestionsSharedIds': runIds.slice(batchSize) } }
  );

  return sharedIdsToProcess;
}

async function getFilesForIdsQuery(model: EnforcedWithId<IXModelType>, BATCH_SIZE: number) {
  const sharedIds = await getNextSharedIdsBatch(model, BATCH_SIZE);

  if (!sharedIds) {
    return null;
  }

  // Get all files for these entities
  const allFiles = await filesModel.get(createFilesQueryByEntities(sharedIds));

  // Filter to only files with ready segmentations
  // @ts-expect-error TS(7006): Parameter 'f' implicitly has an 'any' type.
  const allFileIds = allFiles.map(f => f._id);
  const readyFileIds = await filterFileIdsByReadySegmentations(allFileIds);

  if (!readyFileIds.length) {
    return null;
  }

  return createFilesQueryByIds(readyFileIds);
}

async function getFilesForSuggestionsQuery(extractorId: ObjectIdSchema, BATCH_SIZE: number) {
  const readyFileIds = await getFileIdsWithReadySegmentations(extractorId, BATCH_SIZE);

  if (!readyFileIds.length) {
    return null;
  }

  return createFilesQueryByIds(readyFileIds);
}

async function getFilesForSuggestions(extractorId: ObjectIdSchema, limit?: number) {
  const [[model], [extractor]] = await Promise.all([
    ixmodels.get({ extractorId }),
    Extractors.get({ _id: extractorId }),
  ]);

  if (!extractor) {
    return [];
  }

  const BATCH_SIZE = typeof limit === 'number' ? limit : BATCH_SIZE_FOR_PDF;

  // In process_selected, if the selected queue is empty (after trimming), do not sample.
  // End the find phase immediately.
  const isSelectedMode = model.processRun?.mode === 'process_selected';
  const hasSelectedQueue = Array.isArray(model.processRun?.findSuggestionsSharedIds)
    ? model.processRun!.findSuggestionsSharedIds!.length > 0
    : false;
  if (isSelectedMode && !hasSelectedQueue) {
    return [];
  }

  let filesQuery: UwaziFilterQuery<FileType> | null = {};

  if (model.processRun?.findSuggestionsSharedIds?.length) {
    filesQuery = await getFilesForIdsQuery(model, BATCH_SIZE);
  } else {
    filesQuery = await getFilesForSuggestionsQuery(extractorId, BATCH_SIZE);
  }

  if (!filesQuery) {
    return [];
  }

  const filesToProcess = await filesModel.get(
    filesQuery,
    'extractedMetadata entity language filename'
  );

  const filesWithAggregation = await getFilesWithAggregations(
    filesToProcess as (FileType & FileEnforcedNotUndefined)[]
  );

  return filesWithAggregation;
}

export {
  BATCH_SIZE_FOR_PDF,
  BATCH_SIZE_FOR_PROPERTY,
  getFilesForTraining,
  getEntitiesForTraining,
  getFilesForSuggestions,
  getEntitiesForSuggestions,
  getSegmentedFilesIds,
  getPropertyType,
  propertyTypeIsSelectOrMultiSelect,
  propertyTypeIsWithoutExtractedMetadata,
  propertyTypeIsMultiValued,
  NoLabeledEntities,
  NoSegmentedFiles,
  NoFilesForTraining,
};
export type { FileWithAggregation };
