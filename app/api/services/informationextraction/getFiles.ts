/* eslint-disable camelcase */
import { ExtractedMetadataSchema, ObjectIdSchema } from 'shared/types/commonTypes';
import { filesModel } from 'api/files/filesModel';
import { SegmentationType } from 'shared/types/segmentationType';
import entitiesModel from 'api/entities/entitiesModel';
import { SegmentationModel } from 'api/services/pdfsegmentation/segmentationModel';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import ixmodels from 'api/services/informationextraction/ixmodels';
import { FileType } from 'shared/types/fileType';
import { objectIndex } from 'shared/data_utils/objectIndex';
import templatesModel from 'api/templates/templates';
import { propertyTypes } from 'shared/propertyTypes';

const BATCH_SIZE = 50;
const MAX_TRAINING_FILES_NUMBER = 500;

interface FileWithAggregation {
  _id: ObjectIdSchema;
  segmentation: SegmentationType;
  entity: string;
  language: string;
  extractedMetadata: ExtractedMetadataSchema[];
  propertyValue?: string;
}

type FileEnforcedNotUndefined = {
  _id: ObjectIdSchema;
  filename: string;
  language: string;
  entity: string;
  propertyValue?: string;
};

async function getFilesWithAggregations(files: (FileType & FileEnforcedNotUndefined)[]) {
  const filesIds = files.filter(x => x.filename).map(x => x.filename);

  const segmentationForFiles = (await SegmentationModel.get(
    { filename: { $in: filesIds } },
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
    propertyValue: file.propertyValue,
  }));
}

async function getSegmentedFilesIds() {
  const segmentations = await SegmentationModel.get({ status: 'ready' }, 'fileID');
  return segmentations.filter(x => x.fileID).map(x => x.fileID);
}

async function getFilesForTraining(templates: ObjectIdSchema[], property: string) {
  const entities = await entitiesModel.getUnrestricted(
    { template: { $in: templates } },
    `sharedId metadata.${property}`
  );
  const entitiesFromTrainingTemplatesIds = entities.filter(x => x.sharedId).map(x => x.sharedId);
  const files = (await filesModel.get(
    {
      type: 'document',
      filename: { $exists: true },
      language: { $exists: true },
      'extractedMetadata.name': property,
      _id: { $in: await getSegmentedFilesIds() },
      entity: { $in: entitiesFromTrainingTemplatesIds },
    },
    'extractedMetadata entity language filename',
    { limit: MAX_TRAINING_FILES_NUMBER }
  )) as (FileType & FileEnforcedNotUndefined)[];

  const indextedEntities = objectIndex(entities, e => e.sharedId);
  const template = await templatesModel.getById(templates[0]);
  const { type } = template?.properties?.find(p => p.name === property) || {};

  if (!type) {
    throw new Error(`Property "${property}" does not exists`);
  }

  const filesWithEntityValue = files.map(file => {
    const entity = indextedEntities[file.entity];
    if (!entity?.metadata || !entity?.metadata[property]?.length) {
      return file;
    }

    let [{ value }] = entity.metadata[property] || [{}];
    if (type === propertyTypes.date) {
      value = new Date(value * 1000).toLocaleDateString(entity.language);
    }

    return { ...file, propertyValue: value };
  });

  return getFilesWithAggregations(filesWithEntityValue);
}

async function getFilesForSuggestions(templates: ObjectIdSchema[], property: string) {
  const [currentModel] = await ixmodels.get({ propertyName: property });

  const suggestions = await IXSuggestionsModel.get(
    { propertyName: property, date: { $gt: currentModel.creationDate } },
    'entityId'
  );

  const suggestionsIds = suggestions.filter(x => x.entityId).map(x => x.entityId);

  const entities = await entitiesModel.getUnrestricted(
    { template: { $in: templates }, sharedId: { $nin: suggestionsIds } },
    'sharedId'
  );
  const entitiesFromTrainingTemplatesIds = entities.filter(x => x.sharedId).map(x => x.sharedId);

  const files = (await filesModel.get(
    {
      type: 'document',
      filename: { $exists: true },
      _id: { $in: await getSegmentedFilesIds() },
      entity: { $in: entitiesFromTrainingTemplatesIds },
      language: { $exists: true },
    },
    'extractedMetadata entity language filename',
    { limit: BATCH_SIZE }
  )) as (FileType & FileEnforcedNotUndefined)[];

  return getFilesWithAggregations(files);
}

export { getFilesForTraining, getFilesForSuggestions };
export type { FileWithAggregation };
