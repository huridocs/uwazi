import { ObjectId } from 'mongodb';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { Entity, Fixture, Template } from '../types';

const templateId = new ObjectId();
const dictionaryId = new ObjectId();

const dictionaries: ThesaurusSchema[] = [
  {
    _id: dictionaryId,
    name: 'test_dictionary',
    values: [
      { id: 'valid_id_1', label: 'Valid Option 1' },
      {
        id: 'group_id',
        label: 'A Group',
        values: [{ id: 'valid_id_2', label: 'Valid Option 2 (nested)' }],
      },
    ],
  },
];

const templates: Template[] = [
  {
    _id: templateId,
    name: 'test_template',
    properties: [
      { _id: new ObjectId(), label: 'Text', name: 'text', type: 'text' },
      {
        _id: new ObjectId(),
        label: 'Select',
        name: 'select',
        type: 'select',
        content: dictionaryId.toString(),
      },
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
      select: [{ value: 'valid_id_1', label: 'Valid Option 1' }],
      relationship: [{ value: 'other_sharedId', label: 'Other' }],
    },
  },
  {
    _id: new ObjectId(),
    title: 'entity_with_nested_valid_select',
    sharedId: 'nested_valid_sharedId',
    template: templateId,
    language: 'en',
    metadata: {
      text: [],
      select: [{ value: 'valid_id_2', label: 'Valid Option 2 (nested)' }],
      relationship: [],
    },
  },
  {
    _id: new ObjectId(),
    title: 'entity_without_metadata',
    sharedId: 'no_metadata_sharedId',
    template: templateId,
    language: 'en',
  },
  {
    _id: new ObjectId(),
    title: 'entity_non_select_ghost_like_value',
    sharedId: 'non_select_ghost_sharedId',
    template: templateId,
    language: 'en',
    metadata: {
      // 'text' is not a select/multiselect — must never be touched even if value looks like a ghost
      text: [{ value: 'ghost_id' }],
      select: [],
      relationship: [],
    },
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
  // Null values → []
  {
    _id: new ObjectId(),
    title: 'entity_null_value',
    sharedId: 'null_value_sharedId',
    template: templateId,
    language: 'en',
    metadata: {
      //@ts-ignore
      text: [{ value: null }],
      //@ts-ignore
      select: [{ value: null }],
      relationship: [],
    },
  },
  // Select property with only a ghost ref → select becomes []
  {
    _id: new ObjectId(),
    title: 'entity_ghost_ref_only',
    sharedId: 'ghost_ref_sharedId',
    template: templateId,
    language: 'en',
    metadata: {
      text: [{ value: 'some text' }],
      select: [{ value: 'ghost_id', label: null }],
      relationship: [],
    },
  },
  // Select property mixing a valid entry and a ghost ref → ghost is removed, valid survives
  {
    _id: new ObjectId(),
    title: 'entity_partial_ghost_ref',
    sharedId: 'partial_ghost_ref_sharedId',
    template: templateId,
    language: 'en',
    metadata: {
      text: [],
      select: [
        { value: 'valid_id_1', label: 'Valid Option 1' },
        { value: 'ghost_id', label: null },
      ],
      relationship: [],
    },
  },
];

const correctFixtures: Fixture = {
  templates,
  dictionaries,
  entities: correctEntities,
};

const fixtures: Fixture = {
  templates,
  dictionaries,
  entities: [...correctEntities, ...faultyEntities],
};

export { fixtures, correctFixtures, correctEntities };
