// Inlined from app/api/relationships/ — migrations are snapshots in time.
// No imports from app/api are allowed; all logic operates on a raw MongoDB Db instance.
/* eslint-disable no-await-in-loop */
import { Db, ObjectId } from 'mongodb';

// ── Types ─────────────────────────────────────────────────────────────────────

export type Property = {
  type: string;
  name: string;
  content?: string;
  relationType?: ObjectId | string;
};

export type Template = {
  _id: ObjectId;
  properties: Property[];
};

export type Entity = {
  _id: ObjectId;
  sharedId: string;
  language: string;
  template: ObjectId;
  metadata?: Record<string, { value: string }[]>;
};

type RelationshipCandidate = {
  entity: string;
  hub: ObjectId;
  // string | ObjectId — stored as string from property.relationType, converted to ObjectId on insert
  template?: ObjectId | string;
};

// ── Pure helpers (inlined from relationships.js) ──────────────────────────────

// Inlined from getPropertiesToBeConnections (relationships.js)
export function getRelationshipProperties(template: Template): Property[] {
  const props: Property[] = [];
  for (const prop of template.properties) {
    const repeated = props.find(
      p => p.content === prop.content && p.relationType === prop.relationType
    );
    if (prop.type === 'relationship' && !repeated) {
      props.push(prop);
    }
  }
  return props;
}

// Inlined from determinePropertyValues (relationships.js)
function determinePropertyValues(entity: Entity, propertyName: string): string[] {
  const metadata = entity.metadata ?? {};
  const propertyValues = (metadata[propertyName] ?? []) as { value: string }[];
  return propertyValues.map(mo => mo.value);
}

// ── DB helpers (inlined from relationshipsHelpers.js, adapted to raw Db) ──────

// Inlined from getEntityReferencesByRelationshipTypes (relationshipsHelpers.js)
// Key change: db.collection('connections').aggregate() instead of model.db.aggregate()
async function getEntityReferencesByRelationshipTypes(
  db: Db,
  sharedId: string,
  relationTypes: (ObjectId | string)[]
): Promise<Record<string, Record<string, any>>> {
  const value = await db
    .collection('connections')
    .aggregate([
      { $match: { entity: sharedId } },
      { $project: { hub: 1 } },
      {
        $lookup: {
          from: 'connections',
          localField: 'hub',
          foreignField: 'hub',
          as: 'rightSide',
        },
      },
      {
        $project: {
          hub: 1,
          'rightSide._id': 1,
          'rightSide.entity': 1,
          'rightSide.template': 1,
        },
      },
      { $unwind: '$rightSide' },
      {
        $match: {
          'rightSide.template': { $in: relationTypes.map(t => new ObjectId(t as string)) },
        },
      },
      {
        $lookup: {
          from: 'entities',
          localField: 'rightSide.entity',
          foreignField: 'sharedId',
          as: 'rightSide.entityData',
        },
      },
      {
        $project: {
          hub: 1,
          'rightSide._id': 1,
          'rightSide.entity': 1,
          'rightSide.template': 1,
          'rightSide.entityData.template': 1,
        },
      },
      {
        $group: {
          _id: '$rightSide.template',
          references: { $push: '$$ROOT' },
        },
      },
    ])
    .toArray();

  return Object.fromEntries(
    (value as any[]).map(group => [
      group._id,
      Object.fromEntries(group.references.map((r: any) => [r.rightSide.entity, r])),
    ])
  );
}

// Inlined from guessRelationshipPropertyHub (relationshipsHelpers.js)
// Key change: db.collection('connections').aggregate() instead of model.db.aggregate()
async function guessRelationshipPropertyHub(
  db: Db,
  sharedId: string,
  relationType: ObjectId
): Promise<{ _id: ObjectId }[]> {
  return db
    .collection('connections')
    .aggregate([
      { $match: { entity: sharedId } },
      {
        $lookup: {
          from: 'connections',
          localField: 'hub',
          foreignField: 'hub',
          as: 'rightSide',
        },
      },
      { $unwind: '$rightSide' },
      { $match: { 'rightSide.entity': { $ne: sharedId } } },
      {
        $group: {
          _id: '$rightSide.hub',
          templates: { $addToSet: '$rightSide.template' },
        },
      },
      {
        $match: {
          $and: [{ 'templates.0': relationType }, { 'templates.1': { $exists: false } }],
        },
      },
    ])
    .toArray() as Promise<{ _id: ObjectId }[]>;
}

// ── Core logic (inlined from relationships.js, adapted to raw Db) ─────────────

// Inlined from generateCreatedReferences (relationships.js)
async function generateCreatedReferences(
  db: Db,
  property: Property,
  newValues: string[],
  entity: Entity,
  existingReferences: Record<string, Record<string, any>>
): Promise<{ newReferencesBase: RelationshipCandidate[]; newReferences: RelationshipCandidate[] }> {
  const { relationType: propertyRelationType } = property;

  const toCreate = newValues.filter(v => !existingReferences[propertyRelationType as string]?.[v]);

  if (!toCreate.length) return { newReferencesBase: [], newReferences: [] };

  const candidateHub = await guessRelationshipPropertyHub(
    db,
    entity.sharedId,
    new ObjectId(propertyRelationType as string)
  );

  const hubId = candidateHub[0]?._id ?? new ObjectId();
  const newReferencesBase: RelationshipCandidate[] = candidateHub[0]
    ? []
    : [{ entity: entity.sharedId, hub: hubId }];

  const newReferences: RelationshipCandidate[] = toCreate.map(value => ({
    entity: value,
    hub: hubId,
    template: propertyRelationType,
  }));

  return { newReferencesBase, newReferences };
}

// Inlined from separateCreatedDeletedReferences (relationships.js)
async function separateCreatedDeletedReferences(
  db: Db,
  property: Property,
  entity: Entity,
  existingReferences: Record<string, Record<string, any>>
): Promise<{
  newReferencesBase: RelationshipCandidate[];
  newReferences: RelationshipCandidate[];
  toDelete: ObjectId[];
}> {
  const newValues = determinePropertyValues(entity, property.name);
  const newValueSet = new Set(newValues);

  const { relationType: propertyRelationType, content: propertyEntityType } = property;

  const { newReferencesBase, newReferences } = await generateCreatedReferences(
    db,
    property,
    newValues,
    entity,
    existingReferences
  );

  const toDelete: ObjectId[] = Object.entries(
    existingReferences[propertyRelationType as string] ?? {}
  )
    .map(entry => entry[1])
    .filter(
      r =>
        r.rightSide.entity !== entity.sharedId &&
        (!propertyEntityType ||
          r.rightSide.entityData[0]?.template?.toString() === propertyEntityType) &&
        !newValueSet.has(r.rightSide.entity)
    )
    .map(r => r.rightSide._id);

  return { newReferencesBase, newReferences, toDelete };
}

// Inlined from save() + prepareRelationshipsToSave() (relationships.js)
// Key changes:
//   - raw db.collection('entities').find() instead of entities.get() via ModelWithPermissions
//     (this is the exact permission filter that caused the original bug — bypassing it is correct)
//   - raw db.collection('connections').insertMany() instead of model.saveMultiple()
//   - skips schema validation (migration context, not user input)
//   - skips metadata denormalization (entity.metadata is already correct; we are only fixing hubs)
async function saveRelationships(
  db: Db,
  relationships: RelationshipCandidate[],
  language: string
): Promise<void> {
  if (!relationships.length) return;

  const sharedIds = [...new Set(relationships.map(r => r.entity))];
  const existingSharedIds = new Set(
    (
      await db
        .collection('entities')
        .find({ sharedId: { $in: sharedIds }, language }, { projection: { sharedId: 1 } })
        .toArray()
    ).map((e: any) => e.sharedId as string)
  );

  const toInsert = relationships
    .filter(r => existingSharedIds.has(r.entity))
    .map(r => ({
      _id: new ObjectId(),
      entity: r.entity,
      hub: r.hub,
      ...(r.template ? { template: new ObjectId(r.template as string) } : {}),
    }));

  if (toInsert.length) {
    await db.collection('connections').insertMany(toInsert);
  }
}

// Inlined from delete() (relationships.js), called with updateMetdata = false
// Key changes:
//   - raw db.collection('connections') instead of model.get() / model.delete()
//   - skips metadata denormalization (not needed for migration)
async function deleteRelationships(db: Db, ids: ObjectId[]): Promise<void> {
  if (!ids.length) return;

  const relationsToDelete = await db
    .collection('connections')
    .find({ _id: { $in: ids } }, { projection: { hub: 1 } })
    .toArray();

  const hubsAffected = [...new Set((relationsToDelete as any[]).map(r => r.hub.toString()))].map(
    h => new ObjectId(h)
  );

  await db.collection('connections').deleteMany({ _id: { $in: ids } });

  // Delete orphan hubs — hubs with fewer than 2 remaining connections
  const orphanHubs = await db
    .collection('connections')
    .aggregate([
      { $match: { hub: { $in: hubsAffected } } },
      { $group: { _id: '$hub', count: { $sum: 1 } } },
      { $match: { count: { $lt: 2 } } },
    ])
    .toArray();

  if (orphanHubs.length) {
    await db
      .collection('connections')
      .deleteMany({ hub: { $in: (orphanHubs as any[]).map(h => h._id) } });
  }
}

// Inlined from saveEntityBasedReferences + prepareSaveEntityBasedReferences (relationships.js)
export async function saveEntityBasedReferences(
  db: Db,
  entity: Entity,
  language: string,
  template: Template
): Promise<void> {
  const relationshipProperties = getRelationshipProperties(template);
  if (!relationshipProperties.length) return;

  const existingReferences = await getEntityReferencesByRelationshipTypes(
    db,
    entity.sharedId,
    relationshipProperties.map(p => p.relationType!)
  );

  const relationshipsToCreate: RelationshipCandidate[] = [];
  const relationshipsToDelete: ObjectId[] = [];

  for (const property of relationshipProperties) {
    const { newReferencesBase, newReferences, toDelete } = await separateCreatedDeletedReferences(
      db,
      property,
      entity,
      existingReferences
    );
    relationshipsToCreate.push(...newReferencesBase, ...newReferences);
    relationshipsToDelete.push(...toDelete);
  }

  if (relationshipsToCreate.length) {
    await saveRelationships(db, relationshipsToCreate, language);
  }
  if (relationshipsToDelete.length) {
    await deleteRelationships(db, relationshipsToDelete);
  }
}
