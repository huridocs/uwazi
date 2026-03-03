import { ObjectId } from 'mongodb';
import { Entity, Fixture, Template } from '../types';

const templateId = new ObjectId();

const templates: Template[] = [
  {
    _id: templateId,
    name: 'test_template',
    properties: [
      { _id: new ObjectId(), label: 'Text', name: 'text', type: 'text' },
      { _id: new ObjectId(), label: 'Markdown', name: 'markdown', type: 'markdown' },
      { _id: new ObjectId(), label: 'Select', name: 'select', type: 'select' },
      { _id: new ObjectId(), label: 'Relationship', name: 'relationship', type: 'relationship' },
    ],
  },
];

// Entities that must NOT be modified by the migration
const correctEntities: Entity[] = [
  // Already has a real value — must not be touched
  {
    _id: new ObjectId(),
    title: 'entity_with_real_text',
    sharedId: 'real_text_sharedId',
    template: templateId,
    language: 'en',
    metadata: {
      text: [{ value: 'some text' }],
      markdown: [{ value: '# Hello' }],
      select: [],
      relationship: [],
    },
  },
  // Non text/markdown empty arrays must not be touched
  {
    _id: new ObjectId(),
    title: 'entity_non_text_empty',
    sharedId: 'non_text_empty_sharedId',
    template: templateId,
    language: 'en',
    metadata: {
      text: [{ value: '' }],
      markdown: [{ value: '' }],
      select: [],
      relationship: [],
    },
  },
  // Entity without metadata — must not be touched
  {
    _id: new ObjectId(),
    title: 'entity_without_metadata',
    sharedId: 'no_metadata_sharedId',
    template: templateId,
    language: 'en',
  },
  // Entity with metadata: null — must not be touched
  {
    _id: new ObjectId(),
    title: 'entity_null_metadata',
    sharedId: 'null_metadata_sharedId',
    template: templateId,
    language: 'en',
    //@ts-ignore
    metadata: null,
  },
];

// Entities that need fixing (text/markdown are [] → should become [{ value: '' }])
const faultyEntities: Entity[] = [
  // Both text and markdown are [] → both become [{ value: '' }]
  {
    _id: new ObjectId(),
    title: 'entity_both_empty',
    sharedId: 'both_empty_sharedId',
    template: templateId,
    language: 'en',
    metadata: {
      text: [],
      markdown: [],
      select: [],
      relationship: [],
    },
  },
  // Multi-language: both languages have empty text/markdown
  {
    _id: new ObjectId(),
    title: 'entity_both_empty_es',
    sharedId: 'both_empty_sharedId',
    template: templateId,
    language: 'es',
    metadata: {
      text: [],
      markdown: [],
      select: [],
      relationship: [],
    },
  },
  // Only text is [] — markdown already has a value
  {
    _id: new ObjectId(),
    title: 'entity_only_text_empty',
    sharedId: 'only_text_empty_sharedId',
    template: templateId,
    language: 'en',
    metadata: {
      text: [],
      markdown: [{ value: '# Heading' }],
      select: [],
      relationship: [],
    },
  },
  // Only markdown is [] — text already has a value
  {
    _id: new ObjectId(),
    title: 'entity_only_markdown_empty',
    sharedId: 'only_markdown_empty_sharedId',
    template: templateId,
    language: 'en',
    metadata: {
      text: [{ value: 'hello' }],
      markdown: [],
      select: [],
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
