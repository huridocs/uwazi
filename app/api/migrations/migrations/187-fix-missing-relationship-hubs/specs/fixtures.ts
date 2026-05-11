import { ObjectId } from 'mongodb';
import { DBFixture } from '#api/utils/testing_db.js';

// ── Relation types ────────────────────────────────────────────────────────────

export const relTypeAId = new ObjectId(); // used by template1 prop "relA"
export const relTypeBId = new ObjectId(); // used by template1 prop "relB" (multi-prop template)

// ── Templates ─────────────────────────────────────────────────────────────────

export const template1Id = new ObjectId();
// template1: one relationship property ("relA" → relTypeA, content: targetTemplate)
// Used by: entityUnpublished, entityPublished, entityAlreadyCorrect, entityStale,
//          entityEmptyMeta, entityNonDefaultLang, entityMutual

export const template2Id = new ObjectId();
// template2: two relationship properties ("relA" → relTypeA, "relB" → relTypeBId)
// Used by: entityMultiProp

export const template3Id = new ObjectId();
// template3: NO relationship properties
// Used by: entityNoRelProps — should never get connections touched

export const targetTemplateId = new ObjectId();
// target entities all share this template (used as content filter)

// ── Entities — target entities (the ones being pointed at) ───────────────────

export const targetEntity1Id = new ObjectId();
// pointed to by: entityUnpublished, entityAlreadyCorrect

export const targetEntity2Id = new ObjectId();
// pointed to by: entityPublished

export const targetEntity3Id = new ObjectId();
// pointed to by: entityStale's hub (stale — no longer in metadata)

export const targetEntity4Id = new ObjectId();
// pointed to by: entityMultiProp via relA

export const targetEntity5Id = new ObjectId();
// pointed to by: entityMultiProp via relB

export const targetEntity6Id = new ObjectId();
// pointed to by: entityMutualB (mutual reference test)

// ── Entities — source entities ────────────────────────────────────────────────

// Case 1: unpublished entity, has relationship metadata, no hub exists → MAIN BUG case
export const entityUnpublishedId = new ObjectId();

// Case 2: published entity, has relationship metadata, no hub exists → same path
export const entityPublishedId = new ObjectId();

// Case 3: entity that already has a correct hub → idempotency
export const entityAlreadyCorrectId = new ObjectId();
export const entityAlreadyCorrectHubId = new ObjectId();

// Case 4: entity whose hub references a target that is no longer in metadata → delete stale hub
export const entityStaleId = new ObjectId();
export const entityStaleHubId = new ObjectId();
export const entityStaleConnectionSelfId = new ObjectId(); // self-side of the stale hub
export const entityStaleConnectionTargetId = new ObjectId(); // target-side of the stale hub

// Case 5: entity with completely empty relationship metadata → no-op
export const entityEmptyMetaId = new ObjectId();

// Case 6: entity whose template has no relationship properties → skip entirely
export const entityNoRelPropsId = new ObjectId();

// Case 7: entity only present in non-default language (es) → should be skipped
export const entityNonDefaultLangId = new ObjectId();

// Case 8: template with two relationship properties
export const entityMultiPropId = new ObjectId();

// Case 9: mutual reference — A points to B, B points to A, should share a hub
export const entityMutualAId = new ObjectId();
export const entityMutualBId = new ObjectId();

export const fixtures: DBFixture = {
  settings: [
    {
      _id: new ObjectId(),
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],

  relationtypes: [
    { _id: relTypeAId, name: 'Relation Type A' },
    { _id: relTypeBId, name: 'Relation Type B' },
  ],

  templates: [
    {
      _id: template1Id,
      name: 'Template 1',
      properties: [
        {
          _id: new ObjectId(),
          type: 'relationship',
          name: 'relA',
          relationType: relTypeAId.toHexString(),
          content: targetTemplateId.toHexString(),
        },
      ],
    },
    {
      _id: template2Id,
      name: 'Template 2 (multi-prop)',
      properties: [
        {
          _id: new ObjectId(),
          type: 'relationship',
          name: 'relA',
          relationType: relTypeAId.toHexString(),
          content: targetTemplateId.toHexString(),
        },
        {
          _id: new ObjectId(),
          type: 'relationship',
          name: 'relB',
          relationType: relTypeBId.toHexString(),
          content: targetTemplateId.toHexString(),
        },
      ],
    },
    {
      _id: template3Id,
      name: 'Template 3 (no rel props)',
      properties: [{ _id: new ObjectId(), type: 'text', name: 'title' }],
    },
    {
      _id: targetTemplateId,
      name: 'Target Template',
      properties: [],
    },
  ],

  entities: [
    // Target entities (all en, published, template = targetTemplate)
    {
      _id: targetEntity1Id,
      sharedId: 'target-entity-1',
      language: 'en',
      template: targetTemplateId,
      published: true,
    },
    {
      _id: targetEntity2Id,
      sharedId: 'target-entity-2',
      language: 'en',
      template: targetTemplateId,
      published: true,
    },
    {
      _id: targetEntity3Id,
      sharedId: 'target-entity-3',
      language: 'en',
      template: targetTemplateId,
      published: true,
    },
    {
      _id: targetEntity4Id,
      sharedId: 'target-entity-4',
      language: 'en',
      template: targetTemplateId,
      published: true,
    },
    {
      _id: targetEntity5Id,
      sharedId: 'target-entity-5',
      language: 'en',
      template: targetTemplateId,
      published: true,
    },
    {
      _id: targetEntity6Id,
      sharedId: 'target-entity-6',
      language: 'en',
      template: targetTemplateId,
      published: true,
    },

    // Case 1: unpublished, has relationship metadata, NO hub exists → hub must be created
    {
      _id: entityUnpublishedId,
      sharedId: 'entity-unpublished',
      language: 'en',
      template: template1Id,
      published: false,
      metadata: {
        relA: [{ value: 'target-entity-1' }],
      },
    },

    // Case 2: published, has relationship metadata, NO hub exists → hub must be created
    {
      _id: entityPublishedId,
      sharedId: 'entity-published',
      language: 'en',
      template: template1Id,
      published: true,
      metadata: {
        relA: [{ value: 'target-entity-2' }],
      },
    },

    // Case 3: already has a correct hub → idempotency, no second hub created
    {
      _id: entityAlreadyCorrectId,
      sharedId: 'entity-already-correct',
      language: 'en',
      template: template1Id,
      published: false,
      metadata: {
        relA: [{ value: 'target-entity-1' }],
      },
    },

    // Case 4: stale hub — metadata changed from target-entity-3 to target-entity-4.
    // Existing hub points to target-entity-3 (stale); migration replaces with target-entity-4.
    {
      _id: entityStaleId,
      sharedId: 'entity-stale',
      language: 'en',
      template: template1Id,
      published: false,
      metadata: {
        relA: [{ value: 'target-entity-4' }],
      },
    },

    // Case 5: empty relationship metadata → no hub should be created (not processed by migration)
    {
      _id: entityEmptyMetaId,
      sharedId: 'entity-empty-meta',
      language: 'en',
      template: template1Id,
      published: false,
      metadata: {
        relA: [],
      },
    },

    // Case 6: template with no relationship properties → untouched
    {
      _id: entityNoRelPropsId,
      sharedId: 'entity-no-rel-props',
      language: 'en',
      template: template3Id,
      published: false,
      metadata: {},
    },

    // Case 7: only in non-default language (es) → skipped, no hub created
    {
      _id: entityNonDefaultLangId,
      sharedId: 'entity-non-default-lang',
      language: 'es',
      template: template1Id,
      published: false,
      metadata: {
        relA: [{ value: 'target-entity-1' }],
      },
    },

    // Case 8: two relationship properties → two independent hubs created
    {
      _id: entityMultiPropId,
      sharedId: 'entity-multi-prop',
      language: 'en',
      template: template2Id,
      published: false,
      metadata: {
        relA: [{ value: 'target-entity-4' }],
        relB: [{ value: 'target-entity-5' }],
      },
    },

    // Case 9a: mutual A — points to mutual B
    {
      _id: entityMutualAId,
      sharedId: 'entity-mutual-a',
      language: 'en',
      template: template1Id,
      published: false,
      metadata: {
        relA: [{ value: 'target-entity-6' }],
      },
    },

    // Case 9b: mutual B (target-entity-6 is used as the "other side" target)
    // Not processed directly — it uses targetTemplateId which has no relationship properties
  ],

  connections: [
    // Case 3 (already correct): existing hub for entity-already-correct → target-entity-1
    // Two entries in the hub: self-side + target-side
    {
      _id: new ObjectId(),
      entity: 'entity-already-correct',
      hub: entityAlreadyCorrectHubId,
    },
    {
      _id: new ObjectId(),
      entity: 'target-entity-1',
      hub: entityAlreadyCorrectHubId,
      template: relTypeAId,
    },

    // Case 4 (stale): existing hub for entity-stale → target-entity-3 (but target is no longer in metadata)
    {
      _id: entityStaleConnectionSelfId,
      entity: 'entity-stale',
      hub: entityStaleHubId,
    },
    {
      _id: entityStaleConnectionTargetId,
      entity: 'target-entity-3',
      hub: entityStaleHubId,
      template: relTypeAId,
    },
  ],
};
