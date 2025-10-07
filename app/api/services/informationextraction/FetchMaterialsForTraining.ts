/* eslint-disable max-statements */
import { EnforcedWithId, UwaziFilterQuery } from 'api/odm';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { IXExtractorType } from 'shared/types/extractorType';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import entitiesModel from 'api/entities/entitiesModel';
import { filesModel } from 'api/files/filesModel';
import { SegmentationModel } from 'api/services/pdfsegmentation/segmentationModel';
import { ensure } from 'shared/tsUtils';
import { ObjectId } from 'mongodb';
import { EntitySchema } from 'shared/types/entityType';
import { LanguageUtils } from 'shared/language';
import {
  getEntitiesForTraining,
  getFilesForTraining,
  FileWithAggregation,
  MAX_TRAINING_FILES_NUMBER,
  MAX_TRAINING_ENTITIES_NUMBER,
  PropertyValue,
} from './ixMaterials';
import { IXServices } from './IXServices';
import { IXModelsModel } from './IXModelsModel';
import { deriveTrainingPropertyValue } from './propertyValue';

// Stage A — fetch marked for training
async function getMarkedEntityPairs(extractorId: ObjectId) {
  const pairs = await IXSuggestionsModel.db
    .find({ extractorId, useForTraining: true })
    .select({ entityId: 1, language: 1 })
    .lean();
  const unique = Array.from(new Set(pairs.map(p => `${p.entityId}::${p.language || ''}`)))
    .map(key => {
      const [sharedId, language] = key.split('::');
      return { sharedId, language };
    })
    .filter(p => p.sharedId && p.language);
  return unique as { sharedId: string; language: string }[];
}

const getPropertyTrainingEntities = async (extractor: EnforcedWithId<IXExtractorType>) => {
  const extractorId = extractor._id as ObjectId;
  const [model] = await IXModelsModel.get({ extractorId });
  const samplePolicy = model?.processRun?.samplePolicy;
  const pairs = await getMarkedEntityPairs(extractorId);

  // Stage A: marked cohort (bypass labeled guard)
  let stageA: EntitySchema[] = [];
  if (pairs.length) {
    const entityQuery = { $or: pairs } as UwaziFilterQuery<any>;
    stageA = await entitiesModel.getUnrestricted(
      entityQuery,
      `sharedId title metadata.${extractor.property} metadata.${extractor.source.property} language`,
      { limit: MAX_TRAINING_ENTITIES_NUMBER }
    );
  }

  // Stage B: existing logic with adjusted limit
  const remainingBudget = Math.max(0, MAX_TRAINING_ENTITIES_NUMBER - stageA.length);
  let stageB: EntitySchema[] = [];
  if (remainingBudget > 0 && samplePolicy !== 'only_marked') {
    const candidates = await getEntitiesForTraining(
      extractor.templates,
      extractor.property,
      extractor.source.property!
    );

    // Exclude Stage A duplicates by (sharedId, language)
    const seen = new Set(stageA.map(e => `${e.sharedId}::${e.language}`));
    stageB = candidates
      .filter((e: any) => !seen.has(`${e.sharedId}::${e.language}`))
      .slice(0, remainingBudget);
  }

  return [...stageA, ...stageB];
};

async function getMarkedFileIds(extractorId: ObjectId) {
  const marked = await IXSuggestionsModel.db
    .find({ extractorId, useForTraining: true })
    .select({ fileId: 1, entityId: 1, language: 1 })
    .lean();
  // Prefer fileId when present
  const fileIds = marked.map(m => m.fileId).filter((id): id is ObjectId => !!id);
  return Array.from(new Set(fileIds.map(id => id.toString()))).map(id => new ObjectId(id));
}

const buildPdfMaterialsForFiles = async (
  extractor: EnforcedWithId<IXExtractorType>,
  fileIds: ObjectId[],
  options?: { useForTraining?: boolean }
): Promise<FileWithAggregation[]> => {
  if (!fileIds.length) return [];

  const targetProperty = await IXServices.getTargetProperty({ extractor });

  const files = await filesModel.get(
    {
      _id: { $in: fileIds },
      type: 'document',
      filename: { $exists: true },
      language: { $exists: true },
    },
    'extractedMetadata entity language filename'
  );

  const segs = await SegmentationModel.get(
    { fileID: { $in: fileIds }, status: 'ready' },
    'fileID filename xmlname segmentation'
  );
  const segById = new Map(
    segs
      .filter((s): s is typeof s & { fileID: ObjectId } => !!s.fileID)
      .map(s => [s.fileID!.toString(), s])
  );

  const materials = await Promise.all(
    files.map(async f => {
      const seg = segById.get(f._id.toString());
      if (!seg) return null;

      const lookupLang =
        LanguageUtils.fromISO639_3(ensure<string>(f.language), false)?.ISO639_1 ||
        ensure<string>(f.language);
      const [entityLang] = await entitiesModel.getUnrestricted(
        { sharedId: f.entity, language: lookupLang },
        `language metadata.${extractor.property}`
      );
      const entityValues = (entityLang?.metadata?.[extractor.property] || []) as Array<{
        value?: string;
        label?: string;
      }>;
      const selectionText = f.extractedMetadata?.[0]?.selection?.text;
      const entityCurrent = (entityLang?.metadata?.[extractor.property]?.[0]?.value ??
        undefined) as string | number | undefined;
      const propertyValue = deriveTrainingPropertyValue(targetProperty.type, {
        currentValue: entityCurrent,
        selectionText,
        entityValues,
      });

      const item: FileWithAggregation = {
        _id: f._id,
        entity: ensure<string>(f.entity),
        language: entityLang?.language || ensure<string>(f.language),
        extractedMetadata: f.extractedMetadata || [],
        segmentation: seg,
        propertyValue: propertyValue as PropertyValue,
        propertyType: targetProperty.type,
      };

      if (options?.useForTraining) {
        item.useForTraining = true;
      }

      return item;
    })
  );

  return materials.filter((m): m is FileWithAggregation => !!m);
};

const getPdfTrainingProcess = async (extractor: EnforcedWithId<IXExtractorType>) => {
  const extractorId = extractor._id as ObjectId;
  const [model] = await IXModelsModel.get({ extractorId });
  const samplePolicy = model?.processRun?.samplePolicy;
  // Stage A: marked files
  const stageAFileIds = await getMarkedFileIds(extractorId);
  const stageAMaterials = await buildPdfMaterialsForFiles(extractor, stageAFileIds, {
    useForTraining: true,
  });

  // Stage B: existing process
  const { process: baseProcess } = (await getFilesForTraining(extractor)) as any;

  const passed = new Set(stageAMaterials.map(m => m._id.toString()));
  const remainingBudget = Math.max(0, MAX_TRAINING_FILES_NUMBER - stageAMaterials.length);

  const process = async (handler: (file: FileWithAggregation) => Promise<void>): Promise<void> => {
    await ArrayUtils.sequentialFor(stageAMaterials, async m => handler(m));

    if (remainingBudget <= 0 || samplePolicy === 'only_marked') return;

    let delivered = 0;
    await baseProcess(async (f: FileWithAggregation) => {
      if (delivered >= remainingBudget) return;
      const id = f._id.toString();
      if (passed.has(id)) return;
      passed.add(id);
      delivered += 1;
      await handler(f);
    });
  };

  return { process } as {
    process: (handler: (file: FileWithAggregation) => Promise<void>) => Promise<void>;
  };
};

export { getPropertyTrainingEntities, getPdfTrainingProcess };
