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
import languages from 'shared/languages';
import { ensure } from 'shared/tsUtils';

const BATCH_SIZE = 50;
const MAX_TRAINING_FILES_NUMBER = 500;

type PropertyValue = string | Array<{ value: string; label: string }>;

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

const propertyTypeIsSelectOrMultiSelect = (type: string) => selectProperties.has(type);

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
  return segmentations.filter(x => x.fileID).map(x => x.fileID) as ObjectIdSchema[];
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

async function fileQuery(
  property: string,
  propertyType: string,
  entitiesFromTrainingTemplatesIds: string[]
) {
  const needsExtractedMetadata = !propertyTypeIsSelectOrMultiSelect(propertyType);
  const query: {
    type: string;
    filename: { $exists: Boolean };
    language: { $exists: Boolean };
    _id: { $in: ObjectIdSchema[] };
    'extractedMetadata.name'?: string;
    entity: { $in: string[] };
  } = {
    type: 'document',
    filename: { $exists: true },
    language: { $exists: true },
    _id: { $in: await getSegmentedFilesIds() },
    entity: { $in: entitiesFromTrainingTemplatesIds },
  };
  if (needsExtractedMetadata) query['extractedMetadata.name'] = property;
  return query;
}

function entityForTrainingQuery(
  templates: ObjectIdSchema[],
  property: string,
  propertyType: PropertyTypeSchema
) {
  const query: {
    [key: string]: { $in?: ObjectIdSchema[]; $exists?: Boolean; $ne?: any[] };
  } = { template: { $in: templates } };
  if (propertyTypeIsSelectOrMultiSelect(propertyType)) {
    query[`metadata.${property}`] = { $exists: true, $ne: [] };
  }
  return query;
}

async function getFilesForTraining(templates: ObjectIdSchema[], property: string) {
  const propertyType = await getPropertyType(templates, property);
  const entities = await entitiesModel.getUnrestricted(
    entityForTrainingQuery(templates, property, propertyType),
    `sharedId metadata.${property} language`
  );
  const entitiesFromTrainingTemplatesIds = entities
    .filter(x => x.sharedId)
    .map(x => x.sharedId) as string[];

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
    const fileLang = languages.get(file.language, 'ISO639_1') || defaultLang;
    const entity = indexedEntities[file.entity + fileLang];
    if (!entity?.metadata || !entity?.metadata[property]?.length) {
      return { ...file, propertyType };
    }

    if (propertyTypeIsSelectOrMultiSelect(propertyType)) {
      const propertyValue = (entity.metadata[property] || []).map(({ value, label }) => ({
        value: ensure<string>(value),
        label: ensure<string>(label),
      }));
      return { ...file, propertyValue, propertyType };
    }

    const [{ value }] = entity.metadata[property] || [{}];
    let stringValue: string;
    if (propertyType === propertyTypes.date) {
      stringValue = moment(<number>value * 1000).format('YYYY-MM-DD');
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
  getFilesForSuggestions,
  getSegmentedFilesIds,
  propertyTypeIsSelectOrMultiSelect,
};
export type { FileWithAggregation };
