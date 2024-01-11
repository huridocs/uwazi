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
    Object.entries(_.keyBy(thesauri, '_id')).map(([id, thesaurus]) => {
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
      return [id, expectedParents];
    })
  );
  return parentsExist;
};

const getExpectedParent = (value: string, propertyName: string) => {
  const thesaurusId = thesauriByProperty[propertyName];
  return parentInfo[thesaurusId]?.[value];
};

const metadataIsSelect = (propName: string) => propName in thesauriByProperty;

const valueIsInherited = (value: MetadataObject) => value.inheritedType && value.inheritedValue;

const repairValue = (
  value: MetadataObject,
  propertyName: string
): {
  value: MetadataObject;
  repaired: boolean;
} => {
  if (!valueIsInherited(value) && typeof value.value === 'string') {
    const expectedParent = getExpectedParent(value.value, propertyName);
    const currentParentId = value.parent?.value;
    return expectedParent && expectedParent.id && currentParentId !== expectedParent.id
      ? {
          value: { ...value, parent: { value: expectedParent.id, label: expectedParent.label } },
          repaired: true,
        }
      : { value, repaired: false };
  }
  // eslint-disable-next-line @typescript-eslint/no-use-before-define -- for recursion
  const { newValues, anyRepaired } = repairValues(value.inheritedValue || [], propertyName);
  return anyRepaired
    ? {
        value: { ...value, inheritedValue: newValues },
        repaired: true,
      }
    : { value, repaired: false };
};

const repairValues = (values: MetadataObject[], propertyName: string) => {
  const repairResult = values.map(value => repairValue(value, propertyName));
  const anyRepaired = repairResult.some(r => r?.repaired);
  const newValues = repairResult.map(r => r?.value);
  return { newValues, anyRepaired };
};

const repairMetadata = (metadata: Metadata) => {
  const selects = Object.entries(metadata).filter(([propName]) => metadataIsSelect(propName));
  const newMetadata: [string, MetadataObject[]][] = [];
  selects.forEach(([propName, values]) => {
    const { newValues, anyRepaired } = repairValues(values || [], propName);
    if (anyRepaired) {
      newMetadata.push([propName, newValues]);
    }
  });
  return Object.fromEntries(newMetadata);
};

const modifySelectValues = (entity: Entity) => {
  const newMetadata = repairMetadata(entity.metadata || {});
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

const batchSize = 1000;
const performUpdates = async (db: Db) => {
  if (entitiesToUpdate.length >= batchSize) {
    await flushUpdates(db);
  }
};

const handleEntity = async (db: Db, entity: Entity | null) => {
  if (!entity) return;
  const { newEntity, repaired } = modifySelectValues(entity);
  if (repaired) {
    entitiesToUpdate.push(newEntity);
    await performUpdates(db);
  }
};

const handleEntities = async (db: Db) => {
  const entitiesCollection = db.collection('entities');
  const entityCursor = entitiesCollection.find({});

  while (await entityCursor.hasNext()) {
    const entity = await entityCursor.next();
    await handleEntity(db, entity);
  }
  if (entitiesToUpdate.length) {
    await flushUpdates(db);
  }
};

export default {
  delta: 153,

  name: 'repair_select_parent_denormalization',

  description: 'Supply missing denormalization of parent values in select-like metadata.',

  reindex: false,

  async up(db: Db) {
    writesOccured = false;

    process.stdout.write(`${this.name}...\r\n`);

    await getPropertyThesaurusMap(db);
    if (_.isEmpty(thesauriByProperty)) return;
    if (!(await getParentInfo(db))) return;

    await handleEntities(db);

    this.reindex = writesOccured;
  },
};
