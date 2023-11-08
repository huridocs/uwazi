import { ObjectId } from 'mongodb';
import { FixtureType } from '../types';

const ids = {
  relationType: new ObjectId(),
  unrelatedTemplate: new ObjectId(),
  sourceTemplate: new ObjectId(),
  templateWithOneTypedRelationship: new ObjectId(),
  templateWithOneUntypedRelationship: new ObjectId(),
  templateWithTwoRelationships: new ObjectId(),
};

const typedRelationshipProperty = {
  name: 'relationship_typed_target',
  label: 'relationship_typed_target',
  type: 'relationship' as 'relationship',
  relationType: ids.relationType.toString(),
  content: ids.sourceTemplate.toString(),
};

const untypedRelationshipProperty = {
  name: 'relationship_untyped_target',
  label: 'relationship_untyped_target',
  type: 'relationship' as 'relationship',
  relationType: '',
  content: ids.sourceTemplate.toString(),
};

const noReindexFixtures: FixtureType = {
  relationTypes: [{ _id: ids.relationType, name: 'relation_type' }],
  templates: [
    {
      _id: ids.unrelatedTemplate,
      name: 'unrelated_template',
      properties: [
        { name: 'unrelated_text_prop', label: 'unrelated_text_prop', type: 'text' },
        { name: 'unrelated_numeric_prop', label: 'unrelated_numeric_prop', type: 'numeric' },
      ],
    },
    {
      _id: ids.sourceTemplate,
      name: 'source_template',
      properties: [],
    },
    {
      _id: ids.templateWithOneTypedRelationship,
      name: 'template_with_one_typed_relationship',
      properties: [{ ...typedRelationshipProperty }],
    },
    {
      _id: ids.templateWithOneUntypedRelationship,
      name: 'template_with_one_untyped_relationship',
      properties: [{ ...untypedRelationshipProperty }],
    },
    {
      _id: ids.templateWithTwoRelationships,
      name: 'template_with_two_relationships',
      properties: [{ ...typedRelationshipProperty }, { ...untypedRelationshipProperty }],
    },
  ],
  entities: [
    {
      title: 'unrelated_entity',
      template: ids.unrelatedTemplate,
      sharedId: 'unrelated_entity',
      language: 'en',
      metadata: {
        unrelated_text_prop: [{ value: 'unrelated_text_prop' }],
        unrelated_numeric_prop: [{ value: 1 }],
      },
    },
    {
      title: 'source_1',
      template: ids.sourceTemplate,
      sharedId: 'source_1',
      language: 'en',
      metadata: {},
    },
    {
      title: 'source_2',
      template: ids.sourceTemplate,
      sharedId: 'source_2',
      language: 'en',
      metadata: {},
    },
    {
      title: 'source_3',
      template: ids.sourceTemplate,
      sharedId: 'source_3',
      language: 'en',
      metadata: {},
    },
    {
      title: 'good_entity_with_typed_relationship',
      template: ids.templateWithOneTypedRelationship,
      sharedId: 'good_entity_with_typed_relationship',
      language: 'en',
      metadata: {
        relationship_typed_target: [
          {
            value: 'source_1',
            label: 'source_1',
          },
        ],
      },
    },
    {
      title: 'good_entity_with_untyped_relationship',
      template: ids.templateWithOneUntypedRelationship,
      sharedId: 'good_entity_with_untyped_relationship',
      language: 'en',
      metadata: {
        relationship_untyped_target: [
          {
            value: 'source_2',
            label: 'source_2',
          },
          {
            value: 'source_3',
            label: 'source_3',
          },
        ],
      },
    },
    {
      title: 'good_entity_with_two_relationships',
      template: ids.templateWithTwoRelationships,
      sharedId: 'good_entity_with_two_relationships',
      language: 'en',
      metadata: {
        relationship_typed_target: [
          {
            value: 'source_1',
            label: 'source_1',
          },
          {
            value: 'source_2',
            label: 'source_2',
          },
        ],
        relationship_untyped_target: [
          {
            value: 'source_3',
            label: 'source_3',
          },
        ],
      },
    },
  ],
};

const fixtures: FixtureType = {};

export { fixtures, ids, noReindexFixtures };
