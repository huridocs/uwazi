/* eslint-disable no-await-in-loop */
import _ from 'lodash';
import { Db } from 'mongodb';

import {
  Entity,
  Metadata,
  MetadataObject,
  Property,
  Template,
  Thesaurus,
  ThesaurusValueBase,
  Translation,
} from './types';

let writesOccured = false;

const isSelect = (property: Property) =>
  property.type === 'select' || property.type === 'multiselect';

const isInheritedSelect = (property: Property) =>
  property.inherit?.type === 'select' || property.inherit?.type === 'multiselect';

const thesauriByProperty: Record<string, string> = {};

const getPropertyThesaurusMap = async (db: Db) => {
  const templateCollection = db.collection<Template>('templates');
  const allTemplates = await templateCollection.find({}).toArray();

  const selectProperties = _.flatMap(allTemplates, t => t.properties?.filter(isSelect) || []);
  selectProperties.forEach(property => {
    if (property.content) thesauriByProperty[property.name] = property.content;
    if (property.content && property._id) {
      thesauriByProperty[property._id.toString()] = property.content;
    }
  });

  const inheritedSelectProperties = _.flatMap(
    allTemplates,
    t => t.properties?.filter(isInheritedSelect) || []
  );
  inheritedSelectProperties.forEach(property => {
    if (property.inherit?.property) {
      thesauriByProperty[property.name] = thesauriByProperty[property.inherit.property];
    }
  });
};

type ParentInfo = Record<string, Record<string, ThesaurusValueBase>>;

let parentInfo: ParentInfo = {};

const getParentInfo = async (db: Db): Promise<boolean> => {
  const thesaurusCollection = db.collection<Thesaurus>('dictionaries');
  const thesauri = await thesaurusCollection.find({}).toArray();
  let parentsExist = false;
  parentInfo = Object.fromEntries(
    thesauri.map(thesaurus => {
      const expectedParents: Record<string, ThesaurusValueBase> = {};
      (thesaurus.values || []).forEach(value => {
        if (value.values) {
          parentsExist = true;
          value.values.forEach(child => {
            if (child.id && value.id) {
              expectedParents[child.id] = { id: value.id, label: value.label };
            }
          });
        }
      });
      return [thesaurus._id, expectedParents];
    })
  );
  return parentsExist;
};

const translations: Record<string, Record<string, Record<string, string>>> = {};

const getThesauriTranslations = async (db: Db) => {
  const translationsCollection = db.collection<Translation>('translationsV2');
  const translationsCursor = translationsCollection.find({ 'context.type': 'Thesaurus' });
  while (await translationsCursor.hasNext()) {
    const translation = await translationsCursor.next();
    // eslint-disable-next-line no-continue
    if (!translation) continue;
    if (!translations[translation.context.id]) {
      translations[translation.context.id] = {};
    }
    if (!translations[translation.context.id][translation.language]) {
      translations[translation.context.id][translation.language] = {};
    }
    translations[translation.context.id][translation.language][translation.key] = translation.value;
  }
};

const translateLabel = (label: string, thesaurusId: string, language: string) => {
  const translation = translations[thesaurusId]?.[language]?.[label];
  return translation || label;
};

const getExpectedParent = (value: string, propertyName: string, language: string) => {
  const thesaurusId = thesauriByProperty[propertyName];
  const parent = parentInfo[thesaurusId]?.[value];
  return {
    id: parent?.id,
    label: translateLabel(parent?.label || value, thesaurusId, language),
  };
};

const metadataIsSelect = (propName: string) => propName in thesauriByProperty;

const valueIsInherited = (value: MetadataObject) => value.inheritedType && value.inheritedValue;

const repairValue = (
  value: MetadataObject,
  propertyName: string,
  language: string
): {
  value: MetadataObject;
  repaired: boolean;
} => {
  if (!valueIsInherited(value) && typeof value.value === 'string') {
    const expectedParent = getExpectedParent(value.value, propertyName, language);
    const currentParentId = value.parent?.value;
    return expectedParent && expectedParent.id && currentParentId !== expectedParent.id
      ? {
          value: { ...value, parent: { value: expectedParent.id, label: expectedParent.label } },
          repaired: true,
        }
      : { value, repaired: false };
  }
  // eslint-disable-next-line @typescript-eslint/no-use-before-define -- for recursion
  const { newValues, anyRepaired } = repairValues(
    value.inheritedValue || [],
    propertyName,
    language
  );
  return anyRepaired
    ? {
        value: { ...value, inheritedValue: newValues },
        repaired: true,
      }
    : { value, repaired: false };
};

const repairValues = (values: MetadataObject[], propertyName: string, language: string) => {
  const repairResult = values.map(value => repairValue(value, propertyName, language));
  const anyRepaired = repairResult.some(r => r?.repaired);
  const newValues = repairResult.map(r => r?.value);
  return { newValues, anyRepaired };
};

const repairMetadata = (metadata: Metadata, language: string) => {
  const selects = Object.entries(metadata).filter(([propName]) => metadataIsSelect(propName));
  const newMetadata: [string, MetadataObject[]][] = [];
  selects.forEach(([propName, values]) => {
    const { newValues, anyRepaired } = repairValues(values || [], propName, language);
    if (anyRepaired) {
      newMetadata.push([propName, newValues]);
    }
  });
  return Object.fromEntries(newMetadata);
};

const modifySelectValues = (entity: Entity) => {
  const newMetadata = repairMetadata(entity.metadata || {}, entity.language || 'en');
  const newEntity = {
    ...entity,
    metadata: {
      ...entity.metadata,
      ...newMetadata,
    },
  };
  return { newEntity, repaired: !_.isEmpty(newMetadata) };
};

let entitiesToUpdate: Entity[] = [];

const flushUpdates = async (db: Db) => {
  if (!entitiesToUpdate.length) return;
  const entitiesCollection = db.collection('entities');
  const operations = entitiesToUpdate.map(entity => ({
    updateOne: {
      filter: { _id: entity._id },
      update: { $set: entity },
    },
  }));
  await entitiesCollection.bulkWrite(operations);
  writesOccured = true;
  entitiesToUpdate = [];
};

const performUpdates = async (db: Db, batchSize: number) => {
  if (entitiesToUpdate.length >= batchSize) {
    await flushUpdates(db);
  }
};

const handleEntity = async (db: Db, entity: Entity | null, batchsize: number) => {
  if (!entity) return;
  const { newEntity, repaired } = modifySelectValues(entity);
  if (repaired) {
    entitiesToUpdate.push(newEntity);
    await performUpdates(db, batchsize);
  }
};

const handleEntities = async (db: Db, batchSize: number) => {
  const entitiesCollection = db.collection('entities');
  const entityCursor = entitiesCollection.find({});

  while (await entityCursor.hasNext()) {
    const entity = await entityCursor.next();
    await handleEntity(db, entity, batchSize);
  }
  if (entitiesToUpdate.length) {
    await flushUpdates(db);
  }
};

export default {
  delta: 165,

  name: 'repair_select_parent_denormalization',

  description: 'Supply missing denormalization of parent values in select-like metadata.',

  reindex: false,

  batchSize: 1000,

  async up(db: Db) {
    writesOccured = false;

    process.stdout.write(`${this.name}...\r\n`);

    await getPropertyThesaurusMap(db);
    if (_.isEmpty(thesauriByProperty)) return;
    if (!(await getParentInfo(db))) return;
    await getThesauriTranslations(db);

    await handleEntities(db, this.batchSize);

    this.reindex = writesOccured;
  },
};
