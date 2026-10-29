import { Db, ObjectId } from 'mongodb';
import { nextName, PropertyDoc } from './names.js';
import { agreedName, Pair, TemplateDoc, TemplatePlan, templatesForExtractor } from './plans.js';

const tempKey = (index: number) => `__uwazi_rename_${index}__`;

const sequentially = async <T>(items: T[], visit: (item: T, index: number) => Promise<void>) => {
  await items.reduce(async (previous, item, index) => {
    await previous;
    await visit(item, index);
  }, Promise.resolve());
};

const renameMetadataKey = async (
  db: Db,
  rename: { templateId: ObjectId; from: string; to: string }
) => {
  await db
    .collection('entities')
    .updateMany(
      { template: rename.templateId, [`metadata.${rename.from}`]: { $exists: true } },
      { $rename: { [`metadata.${rename.from}`]: `metadata.${rename.to}` } }
    );
};

const renameMetadata = async (db: Db, templateId: ObjectId, pairs: Pair[]) => {
  await sequentially(pairs, async (pair, index) => {
    await renameMetadataKey(db, { templateId, from: pair.from, to: tempKey(index) });
  });
  await sequentially(pairs, async (pair, index) => {
    await renameMetadataKey(db, { templateId, from: tempKey(index), to: pair.to });
  });
};

const selectionPipeline = (pairs: Pair[]) => [
  {
    $set: {
      propertySelections: {
        $map: {
          input: '$propertySelections',
          as: 'item',
          in: {
            $mergeObjects: [
              '$$item',
              {
                name: {
                  $switch: {
                    branches: pairs.map(pair => ({
                      case: { $eq: ['$$item.name', pair.from] },
                      then: pair.to,
                    })),
                    default: '$$item.name',
                  },
                },
              },
            ],
          },
        },
      },
    },
  },
];

const renameFileSelections = async (db: Db, templateId: ObjectId, pairs: Pair[]) => {
  const sharedIds = await db.collection('entities').distinct('sharedId', { template: templateId });
  if (sharedIds.length === 0 || pairs.length === 0) return;
  await db
    .collection('files')
    .updateMany(
      {
        entity: { $in: sharedIds },
        'propertySelections.name': { $in: pairs.map(pair => pair.from) },
      },
      selectionPipeline(pairs)
    );
};

const renameSuggestions = async (db: Db, templateId: ObjectId, pairs: Pair[]) => {
  const templateKey = templateId.toString();
  await sequentially(pairs, async (pair, index) => {
    await db
      .collection('ixsuggestions')
      .updateMany(
        { entityTemplate: templateKey, propertyName: pair.from },
        { $set: { propertyName: tempKey(index) } }
      );
  });
  await sequentially(pairs, async (pair, index) => {
    await db
      .collection('ixsuggestions')
      .updateMany(
        { entityTemplate: templateKey, propertyName: tempKey(index) },
        { $set: { propertyName: pair.to } }
      );
  });
};

type ExtractorDoc = {
  _id: ObjectId;
  property: string;
  source?: { property?: string };
  templates?: unknown[];
};

const extractorUpdate = (extractor: ExtractorDoc, templates: TemplateDoc[]) => {
  const property = agreedName(templates, extractor.property);
  const sourceName = extractor.source?.property;
  const sourceProperty = sourceName ? agreedName(templates, sourceName) : undefined;
  const $set: Record<string, string> = {};
  if (property !== extractor.property) $set.property = property;
  if (sourceProperty && sourceProperty !== sourceName) $set['source.property'] = sourceProperty;
  return $set;
};

const assertExtractorAgreements = async (db: Db, plans: TemplatePlan[]) => {
  const extractors = await db.collection<ExtractorDoc>('ixextractors').find({}).toArray();
  extractors.forEach(extractor => {
    extractorUpdate(extractor, templatesForExtractor(plans, extractor.templates ?? []));
  });
};

const renameExtractors = async (db: Db, plans: TemplatePlan[]) => {
  const extractors = await db.collection<ExtractorDoc>('ixextractors').find({}).toArray();
  await sequentially(extractors, async extractor => {
    const templates = templatesForExtractor(plans, extractor.templates ?? []);
    const $set = extractorUpdate(extractor, templates);
    if (Object.keys($set).length === 0) return;
    await db.collection('ixextractors').updateOne({ _id: extractor._id }, { $set });
  });
};

const renamedProperties = (properties: PropertyDoc[] | undefined): PropertyDoc[] =>
  (properties ?? []).map(property => {
    const to = nextName(property);
    if (!to) return property;
    return { ...property, name: to };
  });

const renameTemplateProperties = async (db: Db, plans: TemplatePlan[]) => {
  await sequentially(plans, async plan => {
    if (plan.pairs.length === 0) return;
    await db
      .collection('templates')
      .updateOne(
        { _id: plan.template._id },
        { $set: { properties: renamedProperties(plan.template.properties) } }
      );
  });
};

export {
  assertExtractorAgreements,
  renameExtractors,
  renameFileSelections,
  renameMetadata,
  renameSuggestions,
  renameTemplateProperties,
};
