import { ObjectId } from 'mongodb';
import { Entity, Fixture, Template } from '../types';

const templateId = new ObjectId();

const templates: Template[] = [
  {
    _id: templateId,
    name: 'test_template',
    properties: [
      { _id: new ObjectId(), label: 'Text', name: 'text', type: 'text' },
      { _id: new ObjectId(), label: 'Select', name: 'select', type: 'select' },
      { _id: new ObjectId(), label: 'Relationship', name: 'relationship', type: 'relationship' },
    ],
  },
];

// Entities that are already correct — migration must not touch them
const correctEntities: Entity[] = [
  {
    _id: new ObjectId(),
    title: 'entity_already_empty_arrays',
    sharedId: 'already_empty_sharedId',
    template: templateId,
    language: 'en',
    metadata: {
      text: [],
      select: [],
      relationship: [],
    },
  },
  {
    _id: new ObjectId(),
    title: 'entity_already_empty_arrays_es',
    sharedId: 'already_empty_sharedId',
    template: templateId,
    language: 'es',
    metadata: {
      text: [],
      select: [],
      relationship: [],
    },
  },
  {
    _id: new ObjectId(),
    title: 'entity_with_real_values',
    sharedId: 'real_values_sharedId',
    template: templateId,
    language: 'en',
    metadata: {
      text: [{ value: 'some text' }],
      select: [{ value: 'option_id', label: 'Option' }],
      relationship: [{ value: 'other_sharedId', label: 'Other' }],
    },
  },
  {
    _id: new ObjectId(),
    title: 'entity_without_metadata',
    sharedId: 'no_metadata_sharedId',
    template: templateId,
    language: 'en',
  },
];

// Entities that need fixing
const faultyEntities: Entity[] = [
  // All properties have empty-string values → all become []
  {
    _id: new ObjectId(),
    title: 'entity_all_empty_string',
    sharedId: 'all_empty_string_sharedId',
    template: templateId,
    language: 'en',
    metadata: {
      text: [{ value: '' }],
      select: [{ value: '' }],
      relationship: [{ value: '' }],
    },
  },
  {
    _id: new ObjectId(),
    title: 'entity_all_empty_string_es',
    sharedId: 'all_empty_string_sharedId',
    template: templateId,
    language: 'es',
    metadata: {
      text: [{ value: '' }],
      select: [{ value: '' }],
      relationship: [{ value: '' }],
    },
  },
  // Only one property has empty-string value
  {
    _id: new ObjectId(),
    title: 'entity_single_empty_string',
    sharedId: 'single_empty_string_sharedId',
    template: templateId,
    language: 'en',
    metadata: {
      text: [{ value: 'hello' }],
      select: [{ value: '' }],
      relationship: [],
    },
  },
];

const correctFixtures: Fixture = {
  templates,
  entities: correctEntities,
};

const fixtures: Fixture = {
  templates,
  entities: [...correctEntities, ...faultyEntities],
};

export { fixtures, correctFixtures, correctEntities };
