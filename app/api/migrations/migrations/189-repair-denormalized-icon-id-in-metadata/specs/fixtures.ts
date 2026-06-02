import { ObjectId } from 'mongodb';
import { DBFixture } from '#api/utils/testing_db.js';

const templateId = new ObjectId();

const baseEntities: NonNullable<DBFixture['entities']> = [
  {
    _id: new ObjectId(),
    sharedId: 'missing_metadata_shared',
    language: 'en',
    title: 'missing_metadata',
    template: templateId,
  },
  {
    _id: new ObjectId(),
    sharedId: 'null_metadata_shared',
    language: 'en',
    title: 'null_metadata',
    template: templateId,
    metadata: null,
  } as any,
  {
    _id: new ObjectId(),
    sharedId: 'non_array_property_shared',
    language: 'en',
    title: 'non_array_property',
    template: templateId,
    metadata: {
      rel: { value: 'entityA', icon: { id: 'icon-a' } },
    },
  } as any,
  {
    _id: new ObjectId(),
    sharedId: 'array_non_object_entries_shared',
    language: 'en',
    title: 'array_non_object_entries',
    template: templateId,
    metadata: {
      rel: ['not_an_object', 123, null],
    },
  } as any,
  {
    _id: new ObjectId(),
    sharedId: 'entries_without_icon_shared',
    language: 'en',
    title: 'entries_without_icon',
    template: templateId,
    metadata: {
      rel: [{ value: 'entityA', label: 'Entity A', type: 'entity' }],
    },
  },
  {
    _id: new ObjectId(),
    sharedId: 'entries_with_icon_without_id_shared',
    language: 'en',
    title: 'entries_with_icon_without_id',
    template: templateId,
    metadata: {
      rel: [{ value: 'entityA', label: 'Entity A', icon: { _id: 'already_ok', label: 'ok' } }],
    },
  },
];

const entitiesNeedingRepair: NonNullable<DBFixture['entities']> = [
  {
    _id: new ObjectId(),
    sharedId: 'simple_repair_shared',
    language: 'en',
    title: 'simple_repair',
    template: templateId,
    metadata: {
      rel: [{ value: 'entityA', label: 'Entity A', icon: { id: 'flag_a', label: 'Flag A' } }],
    },
  },
  {
    _id: new ObjectId(),
    sharedId: 'multi_property_repair_shared',
    language: 'en',
    title: 'multi_property_repair',
    template: templateId,
    metadata: {
      relA: [
        {
          value: 'entityA',
          label: 'Entity A',
          icon: { id: 'flag_a', label: 'Flag A', type: 'img' },
        },
      ],
      relB: [
        {
          value: 'entityB',
          label: 'Entity B',
          icon: { id: 'flag_b', _id: 'stale', label: 'Flag B', type: 'img' },
        },
      ],
      other: [{ value: 'plain text' }],
    },
  },
  {
    _id: new ObjectId(),
    sharedId: 'non_string_id_repair_shared',
    language: 'en',
    title: 'non_string_id_repair',
    template: templateId,
    metadata: {
      rel: [{ value: 'entityC', label: 'Entity C', icon: { id: 456, label: 'Numeric' } }],
    },
  } as any,
];

const fixtures: DBFixture = {
  templates: [
    {
      _id: templateId,
      name: 'test_template',
      properties: [{ _id: new ObjectId(), name: 'rel', label: 'Rel', type: 'relationship' }],
    },
  ],
  entities: [...baseEntities, ...entitiesNeedingRepair],
};

const alreadyCorrectFixtures: DBFixture = {
  templates: fixtures.templates,
  entities: baseEntities,
};

export { fixtures, alreadyCorrectFixtures };
