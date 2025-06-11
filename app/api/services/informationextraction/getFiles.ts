/* eslint-disable max-lines */
/* eslint-disable max-statements */
/* eslint-disable max-classes-per-file */
/* eslint-disable camelcase */
import moment from 'moment';
import {
  ExtractedMetadataSchema,
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
import { objectIndex } from 'shared/data_utils/objectIndex';
import settings from 'api/settings/settings';
import templatesModel from 'api/templates/templates';
import { propertyTypes } from 'shared/propertyTypes';
import { ensure } from 'shared/tsUtils';
import { LanguageUtils } from 'shared/language';
import { UwaziFilterQuery } from 'api/odm';
import { Entity } from 'api/entities.v2/model/Entity';
import { Extractors } from './ixextractors';

const BATCH_SIZE = 50;
const SOURCE_TEXT_SUGGESTIONS_BATCH_SIZE = 1000;
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
    'filename segmentation xmlname'
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

async function anyFilesSegmented(
  property: string,
  propertyType: string,
  entitiesFromTrainingTemplatesIds: string[]
) {
  const needsExtractedMetadata = !propertyTypeIsWithoutExtractedMetadata(propertyType);
  const segmentedFilesCount = await filesModel.count({
    type: 'document',
    filename: { $exists: true },
    language: { $exists: true },
    _id: { $in: await getSegmentedFilesIds() },
    entity: { $in: entitiesFromTrainingTemplatesIds },
    ...(needsExtractedMetadata ? { 'extractedMetadata.name': property } : {}),
  });
  return !!segmentedFilesCount;
}

async function fileQuery(
  property: string,
  propertyType: string,
  entitiesFromTrainingTemplatesIds: string[]
) {
  const needsExtractedMetadata = !propertyTypeIsWithoutExtractedMetadata(propertyType);
  const query = {
    type: 'document',
    filename: { $exists: true },
    language: { $exists: true },
    _id: { $in: await getSegmentedFilesIds() },
    entity: { $in: entitiesFromTrainingTemplatesIds },
    ...(needsExtractedMetadata ? { 'extractedMetadata.name': property } : {}),
  };
  return query;
}

function entityForTrainingQuery(
  templates: ObjectIdSchema[],
  toProperty: string,
  fromProperty?: string
): UwaziFilterQuery<Entity> {
  const query: UwaziFilterQuery<any> = { template: { $in: templates } };

  if (fromProperty) {
    query[`metadata.${fromProperty}`] = { $exists: true, $ne: [] };
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

async function getEntitiesForSuggestions(extractorId: ObjectIdSchema) {
  const [currentModel] = await ixmodels.get({ extractorId });
  const [extractor] = await Extractors.get({ _id: extractorId });

  const suggestions = await IXSuggestionsModel.get(
    {
      extractorId,
      date: { $lt: currentModel.creationDate },
      'state.error': { $ne: true },
    },
    '',
    { limit: SOURCE_TEXT_SUGGESTIONS_BATCH_SIZE }
  );

  if (!extractor.property || !extractor) {
    return [];
  }

  const propertyType = await getPropertyType(extractor.templates, extractor.property);

  if (!propertyType) {
    return [];
  }

  const entities = await entitiesModel.getUnrestricted(
    {
      sharedId: { $in: suggestions.map(s => s.entityId) },
      language: { $in: suggestions.map(s => s.language) },
    },
    `sharedId metadata.${extractor.property} metadata.${extractor.source.property} language`
  );

  return entities;
}

async function getFilesForTraining(templates: ObjectIdSchema[], property: string) {
  const propertyType = await getPropertyType(templates, property);
  const entities = await entitiesModel.getUnrestricted(
    entityForTrainingQuery(templates, property),
    `sharedId metadata.${property} language`
  );
  const entitiesFromTrainingTemplatesIds = entities
    .filter(x => x.sharedId)
    .map(x => x.sharedId) as string[];

  if (!entitiesFromTrainingTemplatesIds.length) {
    throw new NoLabeledEntities();
  }

  if (!(await anyFilesSegmented(property, propertyType, entitiesFromTrainingTemplatesIds))) {
    throw new NoSegmentedFiles();
  }

  const files = (await filesModel.get(
    await fileQuery(property, propertyType, entitiesFromTrainingTemplatesIds),
    'extractedMetadata entity language filename',
    { limit: MAX_TRAINING_FILES_NUMBER }
  )) as (FileType & FileEnforcedNotUndefined)[];

  const indexedEntities = objectIndex(
    entities,
    e => e.sharedId! + e.language!,
    objectIndex.NoTransform
  );

  const defaultLang = (await settings.getDefaultLanguage())?.key;

  const filesWithEntityValue = files.map(file => {
    const fileLang = LanguageUtils.fromISO639_3(file.language, false)?.ISO639_1 || defaultLang;
    const entity = indexedEntities[file.entity + fileLang];
    if (!entity?.metadata || !entity?.metadata[property]?.length) {
      return { ...file, propertyType };
    }

    if (propertyTypeIsWithoutExtractedMetadata(propertyType)) {
      const propertyValue = (entity.metadata?.[property] || []).map(({ value, label }) => ({
        value: ensure<string>(value),
        label: ensure<string>(label),
      }));
      return { ...file, propertyValue, propertyType };
    }

    const [{ value }] = entity.metadata[property] || [{}];
    let stringValue: string;
    if (propertyType === propertyTypes.date) {
      stringValue = moment(<number>value * 1000)
        .utc()
        .format('YYYY-MM-DD');
    } else if (propertyType === propertyTypes.numeric) {
      stringValue = value?.toString() || '';
    } else {
      stringValue = <string>value;
    }

    return { ...file, propertyValue: stringValue, propertyType };
  });

  return getFilesWithAggregations(filesWithEntityValue);
}

async function getFilesForSuggestions(extractorId: ObjectIdSchema) {
  const [currentModel] = await ixmodels.get({ extractorId });

  const suggestions = await IXSuggestionsModel.get(
    {
      extractorId,
      date: { $lt: currentModel.creationDate },
      'state.error': { $ne: true },
    },
    'fileId',
    { limit: BATCH_SIZE }
  );

  const fileIds = suggestions.filter(x => x.fileId).map(x => x.fileId);

  const files = (await filesModel.get(
    {
      $and: [
        {
          type: 'document',
          filename: { $exists: true },
          language: { $exists: true },
        },
        { _id: { $in: fileIds } },
      ],
    },
    'extractedMetadata entity language filename'
  )) as (FileType & FileEnforcedNotUndefined)[];

  return getFilesWithAggregations(files);
}

export {
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
