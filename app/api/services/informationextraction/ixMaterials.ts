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
} from 'shared/types/commonTypes';
import { filesModel } from 'api/files/filesModel';
import { SegmentationType } from 'shared/types/segmentationType';
import entitiesModel from 'api/entities/entitiesModel';
import { SegmentationModel } from 'api/services/pdfsegmentation/segmentationModel';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import ixmodels from 'api/services/informationextraction/ixmodels';
import { FileType } from 'shared/types/fileType';
import templatesModel from 'api/templates/templates';
import { propertyTypes } from 'shared/propertyTypes';
import { ensure } from 'shared/tsUtils';
import { EnforcedWithId, UwaziFilterQuery } from 'api/odm';
import { Entity } from 'api/entities.v2/model/Entity';
import { IXModelType } from 'shared/types/IXModelType';
import { IXSuggestionType } from 'shared/types/suggestionType';
import { PipelineBuilder } from 'api/suggestions/queryBuilder';
import { IXExtractorType } from 'shared/types/extractorType';
import { ObjectId } from 'mongodb';
import { Extractors } from './ixextractors';
import { IXServices } from './IXServices';

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
    { filename: { $in: filesNames } },
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
  const result = segmentations.filter(x => x.fileID).map(x => x.fileID) as ObjectIdSchema[];
  return result;
}

async function getPropertyType(templates: ObjectIdSchema[], property: string) {
  const template = await templatesModel.getById(templates[0]);

  let type: PropertyTypeSchema | undefined = 'text';
  if (property !== 'title') {
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

function conformSuggestionsQuery(extractorId: ObjectIdSchema, model: EnforcedWithId<IXModelType>) {
  const suggestionsQuery: UwaziFilterQuery<any> = {
    extractorId,
    date: { $lt: model.creationDate },
    'state.error': { $ne: true },
  };

  if (model.testRun) {
    suggestionsQuery.trainingSample = { $ne: true };
  }

  return suggestionsQuery;
}

async function getEntitiesForIdsQuery(model: EnforcedWithId<IXModelType>, BATCH_SIZE: number) {
  if (!model.findSuggestionsSharedIds?.length) {
    await ixmodels.unsetFindSuggestionsData(model._id);
    return null;
  }

  const sharedIdsToProcess = model.findSuggestionsSharedIds!.slice(0, BATCH_SIZE);

  await ixmodels.updateMany(
    { _id: model._id },
    { $set: { findSuggestionsSharedIds: model.findSuggestionsSharedIds!.slice(BATCH_SIZE) } }
  );

  const entityQuery = { sharedId: { $in: sharedIdsToProcess } };

  return entityQuery;
}

async function getEntitiesForSuggestionsQuery(
  extractorId: ObjectIdSchema,
  model: EnforcedWithId<IXModelType>,
  BATCH_SIZE: number
) {
  const suggestionsQuery = conformSuggestionsQuery(extractorId, model);
  const suggestions = await IXSuggestionsModel.get(suggestionsQuery, '', { limit: BATCH_SIZE });

  if (!suggestions.length) {
    return null;
  }

  const entityQuery = {
    sharedId: { $in: [...new Set(suggestions.map(s => s.entityId))] },
    language: { $in: [...new Set(suggestions.map(s => s.language))] },
  };

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

  const BATCH_SIZE = limit || BATCH_SIZE_FOR_PROPERTY;

  let entityQuery: UwaziFilterQuery<any> | null = {};

  if (model.findSuggestionsRunTimestamp) {
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

  const targetLimit = limit || BATCH_SIZE_FOR_PDF;

  const query: UwaziFilterQuery<any> = {
    extractorId,
    date: { $lt: currentModel.creationDate },
  };

  if (currentModel.testRun) {
    query.trainingSample = { $ne: true };
  }

  const batchSize = 100;
  const allFileIds: ObjectIdSchema[] = [];
  const suggestionsWithFailedSegmentations: IXSuggestionType[] = [];

  let skip = 0;
  let hasMore = true;

  while (hasMore && allFileIds.length < targetLimit) {
    // eslint-disable-next-line no-await-in-loop
    const suggestions = await IXSuggestionsModel.get(query, 'fileId', {
      limit: batchSize,
      skip,
    });

    if (!suggestions.length) {
      break;
    }

    const fileIds = suggestions.map(s => s.fileId).filter((id): id is ObjectIdSchema => !!id);

    if (fileIds.length > 0) {
      // eslint-disable-next-line no-await-in-loop
      const segmentations = await SegmentationModel.get(
        { fileID: { $in: fileIds } },
        'fileID status'
      );

      const readySegmentationFileIds = segmentations
        .filter(seg => seg.status === 'ready' && seg.fileID)
        .map(seg => seg.fileID!);

      const failedSegmentationFileIds = segmentations
        .filter(seg => seg.status === 'failed' && seg.fileID)
        .map(seg => seg.fileID!);

      const failedSuggestions = suggestions.filter(s =>
        failedSegmentationFileIds.some(failedId => failedId.toString() === s.fileId?.toString())
      );

      allFileIds.push(...readySegmentationFileIds);
      suggestionsWithFailedSegmentations.push(...failedSuggestions);
    }

    skip += batchSize;
    hasMore = suggestions.length === batchSize;
  }

  if (suggestionsWithFailedSegmentations.length) {
    const modifiedSuggestions = suggestionsWithFailedSegmentations.map(suggestion => ({
      ...suggestion,
      'state.error': true,
      'state.obsolete': false,
      status: 'failed' as IXSuggestionType['status'],
    }));

    await IXSuggestionsModel.saveMultiple(modifiedSuggestions);
  }

  return allFileIds.slice(0, targetLimit);
}

async function getFilesForIdsQuery(model: EnforcedWithId<IXModelType>, BATCH_SIZE: number) {
  if (!model.findSuggestionsSharedIds?.length) {
    await ixmodels.unsetFindSuggestionsData(model._id);
    return null;
  }

  const sharedIdsToProcess = model.findSuggestionsSharedIds!.slice(0, BATCH_SIZE);

  await ixmodels.updateMany(
    { _id: model._id },
    { $set: { findSuggestionsSharedIds: model.findSuggestionsSharedIds!.slice(BATCH_SIZE) } }
  );

  const filesQuery = {
    entity: { $in: sharedIdsToProcess },
    type: 'document',
    filename: { $exists: true },
    language: { $exists: true },
  };

  return filesQuery;
}

async function getFilesForSuggestionsQuery(extractorId: ObjectIdSchema, BATCH_SIZE: number) {
  const allFileIds = await getFileIdsWithReadySegmentations(extractorId, BATCH_SIZE);

  if (allFileIds.length === 0) {
    return null;
  }

  const filesQuery = {
    _id: { $in: allFileIds },
    type: 'document',
    filename: { $exists: true },
    language: { $exists: true },
  };

  return filesQuery;
}

async function getFilesForSuggestions(extractorId: ObjectIdSchema, limit?: number) {
  const [[model], [extractor]] = await Promise.all([
    ixmodels.get({ extractorId }),
    Extractors.get({ _id: extractorId }),
  ]);

  if (!extractor) {
    return [];
  }

  const BATCH_SIZE = limit || BATCH_SIZE_FOR_PDF;

  let filesQuery: UwaziFilterQuery<FileType> | null = {};

  if (model.findSuggestionsRunTimestamp) {
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
