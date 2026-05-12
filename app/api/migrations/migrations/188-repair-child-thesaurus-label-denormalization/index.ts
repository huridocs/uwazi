/* eslint-disable no-await-in-loop, max-statements, max-lines, max-params */
/* eslint-disable import/no-default-export */
import { AnyBulkWriteOperation, Db, ObjectId } from 'mongodb';

const BATCH_SIZE = 500;

type ThesaurusValue = {
  id?: string;
  label?: string;
  values?: ThesaurusValue[];
};

type ThesaurusDocument = {
  _id: ObjectId;
  values?: ThesaurusValue[];
};

type TemplateProperty = {
  _id?: ObjectId;
  name: string;
  type: string;
  content?: string;
  inherit?: { property?: string; type?: string };
};

type TemplateDocument = {
  _id: ObjectId;
  properties?: TemplateProperty[];
};

type MetadataEntry = {
  value?: unknown;
  label?: string;
  parent?: { value?: string; label?: string };
  inheritedType?: string;
  inheritedValue?: MetadataEntry[];
};

type EntityDocument = {
  _id: ObjectId;
  template: ObjectId;
  language?: string;
  metadata?: Record<string, MetadataEntry[]>;
};

type TranslationDocument = {
  context?: { id?: string; type?: string };
  language?: string;
  key?: string;
  value?: string;
};

type ExpectedValue = {
  label: string;
  parent?: { value: string; label: string };
};

type ExpectedByValueId = Record<string, ExpectedValue>;
type ExpectedByThesaurusId = Record<string, ExpectedByValueId>;
type TemplatePropertyMap = Record<string, string>;
type RepairValuesResult = { values: MetadataEntry[]; changed: boolean };

const hasChildren = (thesaurus: ThesaurusDocument) =>
  (thesaurus.values || []).some(value => (value.values || []).length > 0);

const buildExpectedByThesaurus = (thesauri: ThesaurusDocument[]): ExpectedByThesaurusId =>
  Object.fromEntries(
    thesauri.map(thesaurus => {
      const expectedByValueId: ExpectedByValueId = {};
      (thesaurus.values || []).forEach(root => {
        if (root.id && root.label) {
          expectedByValueId[root.id] = { label: root.label };
        }

        (root.values || []).forEach(child => {
          if (child.id && child.label && root.id && root.label) {
            expectedByValueId[child.id] = {
              label: child.label,
              parent: {
                value: root.id,
                label: root.label,
              },
            };
          }
        });
      });

      return [thesaurus._id.toString(), expectedByValueId];
    })
  );

const buildTranslationsByContext = async (
  db: Db,
  thesaurusIds: string[]
): Promise<Record<string, Record<string, Record<string, string>>>> => {
  const result: Record<string, Record<string, Record<string, string>>> = {};
  const cursor = db.collection<TranslationDocument>('translationsV2').find({
    'context.type': 'Thesaurus',
    'context.id': { $in: thesaurusIds },
  });

  while (await cursor.hasNext()) {
    const translation = await cursor.next();
    if (
      !translation?.context?.id ||
      !translation.language ||
      !translation.key ||
      !translation.value
    ) {
      // Skip malformed translation rows.
      // eslint-disable-next-line no-continue
      continue;
    }

    if (!result[translation.context.id]) {
      result[translation.context.id] = {};
    }

    if (!result[translation.context.id][translation.language]) {
      result[translation.context.id][translation.language] = {};
    }

    result[translation.context.id][translation.language][translation.key] = translation.value;
  }

  return result;
};

const buildDirectSelectMaps = (
  templates: TemplateDocument[],
  affectedThesaurusIds: Set<string>
) => {
  const byId: Record<string, string> = {};
  const byName: Record<string, string | null> = {};

  templates.forEach(template => {
    (template.properties || [])
      .filter(
        property =>
          (property.type === 'select' || property.type === 'multiselect') &&
          !!property.content &&
          affectedThesaurusIds.has(property.content)
      )
      .forEach(property => {
        if (!property.content) return;

        if (property._id) {
          byId[property._id.toString()] = property.content;
        }

        if (!(property.name in byName)) {
          byName[property.name] = property.content;
          return;
        }

        if (byName[property.name] !== property.content) {
          byName[property.name] = null;
        }
      });
  });

  return { byId, byName };
};

const getInheritedSourceThesaurus = (
  inheritProperty: string | undefined,
  directSelectById: Record<string, string>,
  directSelectByName: Record<string, string | null>
) => {
  if (!inheritProperty) return null;
  if (directSelectById[inheritProperty]) return directSelectById[inheritProperty];
  const byName = directSelectByName[inheritProperty];
  return byName || null;
};

const buildTemplatePropertyMaps = (
  templates: TemplateDocument[],
  directSelectById: Record<string, string>,
  directSelectByName: Record<string, string | null>
): Record<string, TemplatePropertyMap> =>
  Object.fromEntries(
    templates.map(template => {
      const propertyMap: TemplatePropertyMap = {};

      (template.properties || []).forEach(property => {
        const directById = property._id ? directSelectById[property._id.toString()] : undefined;
        const directByName = directSelectByName[property.name];
        const directThesaurus =
          directById || (typeof directByName === 'string' ? directByName : null);

        if (directThesaurus) {
          propertyMap[property.name] = directThesaurus;
          if (property._id) {
            propertyMap[property._id.toString()] = directThesaurus;
          }
          return;
        }

        if (
          property.type === 'relationship' &&
          (property.inherit?.type === 'select' || property.inherit?.type === 'multiselect')
        ) {
          const inheritedThesaurus = getInheritedSourceThesaurus(
            property.inherit?.property,
            directSelectById,
            directSelectByName
          );

          if (inheritedThesaurus) {
            propertyMap[property.name] = inheritedThesaurus;
            if (property._id) {
              propertyMap[property._id.toString()] = inheritedThesaurus;
            }
          }
        }
      });

      return [template._id.toString(), propertyMap];
    })
  );

const translate = (
  label: string,
  thesaurusId: string,
  language: string,
  translationsByContext: Record<string, Record<string, Record<string, string>>>
) => translationsByContext[thesaurusId]?.[language]?.[label] || label;

function repairValues(
  values: MetadataEntry[],
  thesaurusId: string,
  language: string,
  expectedByThesaurus: ExpectedByThesaurusId,
  translationsByContext: Record<string, Record<string, Record<string, string>>>
): RepairValuesResult {
  const repaired = values.map(value => {
    if (value.inheritedType && Array.isArray(value.inheritedValue)) {
      const repairedInherited = repairValues(
        value.inheritedValue,
        thesaurusId,
        language,
        expectedByThesaurus,
        translationsByContext
      );

      if (!repairedInherited.changed) {
        return { value, changed: false };
      }

      return {
        value: { ...value, inheritedValue: repairedInherited.values },
        changed: true,
      };
    }

    if (typeof value.value !== 'string') {
      return { value, changed: false };
    }

    const expected = expectedByThesaurus[thesaurusId]?.[value.value];
    if (!expected) {
      return { value, changed: false };
    }

    let changed = false;
    const repairedValue: MetadataEntry = { ...value };
    const expectedLabel = translate(expected.label, thesaurusId, language, translationsByContext);
    if (repairedValue.label !== expectedLabel) {
      repairedValue.label = expectedLabel;
      changed = true;
    }

    if (expected.parent) {
      const expectedParent = {
        value: expected.parent.value,
        label: translate(expected.parent.label, thesaurusId, language, translationsByContext),
      };

      if (
        repairedValue.parent?.value !== expectedParent.value ||
        repairedValue.parent?.label !== expectedParent.label
      ) {
        repairedValue.parent = expectedParent;
        changed = true;
      }
    }

    return { value: repairedValue, changed };
  });

  return {
    values: repaired.map(entry => entry.value),
    changed: repaired.some(entry => entry.changed),
  };
}

const flush = async (db: Db, operations: AnyBulkWriteOperation<EntityDocument>[]) => {
  if (!operations.length) {
    return { modifiedCount: 0, operations: [] as AnyBulkWriteOperation<EntityDocument>[] };
  }
  const result = await db.collection<EntityDocument>('entities').bulkWrite(operations, {
    ordered: false,
  });
  return {
    modifiedCount: result.modifiedCount,
    operations: [] as AnyBulkWriteOperation<EntityDocument>[],
  };
};

export default {
  delta: 188,

  name: 'repair_child_thesaurus_label_denormalization',

  description:
    'Repairs stale denormalized labels for hierarchical thesaurus values in select/multiselect ' +
    'metadata (including inherited relationship values) after translation propagation gaps.',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const allThesauri = await db.collection<ThesaurusDocument>('dictionaries').find({}).toArray();
    const thesauriWithChildren = allThesauri.filter(hasChildren);

    if (!thesauriWithChildren.length) {
      process.stdout.write(`${this.name}: no thesauri with child values found.\r\n`);
      this.reindex = false;
      return;
    }

    const affectedThesaurusIds = new Set(thesauriWithChildren.map(t => t._id.toString()));
    const expectedByThesaurus = buildExpectedByThesaurus(thesauriWithChildren);
    const translationsByContext = await buildTranslationsByContext(
      db,
      Array.from(affectedThesaurusIds)
    );

    const templates = await db.collection<TemplateDocument>('templates').find({}).toArray();
    const { byId, byName } = buildDirectSelectMaps(templates, affectedThesaurusIds);
    const templatePropertyMaps = buildTemplatePropertyMaps(templates, byId, byName);
    const relevantTemplates = Object.entries(templatePropertyMaps).filter(
      ([, propertyMap]) => Object.keys(propertyMap).length
    );

    if (!relevantTemplates.length) {
      process.stdout.write(`${this.name}: no relevant select/multiselect properties found.\r\n`);
      this.reindex = false;
      return;
    }

    let operations: AnyBulkWriteOperation<EntityDocument>[] = [];
    let writesOccurred = false;
    let processedEntities = 0;

    for (const [templateId, propertyMap] of relevantTemplates) {
      const metadataKeys = Object.keys(propertyMap);
      const cursor = db.collection<EntityDocument>('entities').find(
        {
          template: new ObjectId(templateId),
          $or: metadataKeys.map(key => ({ [`metadata.${key}.0`]: { $exists: true } })),
        },
        {
          projection: { _id: 1, template: 1, language: 1, metadata: 1 },
        }
      );

      while (await cursor.hasNext()) {
        const entity = await cursor.next();
        if (!entity?.metadata) {
          // eslint-disable-next-line no-continue
          continue;
        }

        let entityChanged = false;
        const updatedMetadata = { ...entity.metadata };
        const language = entity.language || 'en';

        Object.entries(propertyMap).forEach(([propertyKey, thesaurusId]) => {
          const values = updatedMetadata[propertyKey];
          if (!Array.isArray(values) || !values.length) {
            return;
          }

          const repaired = repairValues(
            values,
            thesaurusId,
            language,
            expectedByThesaurus,
            translationsByContext
          );

          if (repaired.changed) {
            updatedMetadata[propertyKey] = repaired.values;
            entityChanged = true;
          }
        });

        if (!entityChanged) {
          // eslint-disable-next-line no-continue
          continue;
        }

        operations.push({
          updateOne: {
            filter: { _id: entity._id },
            update: { $set: { metadata: updatedMetadata } },
          },
        });
        processedEntities += 1;

        if (operations.length >= BATCH_SIZE) {
          const flushResult = await flush(db, operations);
          operations = flushResult.operations;
          const { modifiedCount } = flushResult;
          if (modifiedCount > 0) {
            writesOccurred = true;
          }
        }
      }
    }

    const flushResult = await flush(db, operations);
    operations = flushResult.operations;
    const { modifiedCount } = flushResult;
    if (modifiedCount > 0) {
      writesOccurred = true;
    }

    process.stdout.write(
      `${this.name}: repaired ${processedEntities} entity metadata documents.\r\n`
    );
    this.reindex = writesOccurred;
  },
};
