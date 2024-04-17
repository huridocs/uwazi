import { ObjectId } from 'mongodb';
import { Fixture, Template } from '../types';

const thesauriId = new ObjectId();
const relTypeId = new ObjectId();
const sourceTemplateId = new ObjectId();
const inheritedPropertyId = new ObjectId();

const template: Template = {
  properties: [
    {
      _id: new ObjectId(),
      label: 'Text',
      type: 'text',
      name: 'text',
    },
    {
      content: thesauriId.toString(),
      _id: new ObjectId(),
      label: 'Select',
      type: 'select',
      name: 'select',
    },
    {
      content: sourceTemplateId.toString(),
      _id: new ObjectId(),
      label: 'Relationship',
      type: 'relationship',
      relationType: relTypeId.toString(),
      name: 'relationship',
    },
    {
      content: sourceTemplateId.toString(),
      _id: new ObjectId(),
      label: 'Inherited',
      type: 'relationship',
      relationType: relTypeId.toString(),
      name: 'inherited',
      inherit: {
        property: inheritedPropertyId.toString(),
        type: 'text',
      },
    },
  ],
  entityViewPage: '',
  name: 'test_template',
};

const fixtures: Fixture = {
  settings: [
    {
      _id: new ObjectId(),
      languages: [
        {
          key: 'en',
          default: true,
          label: 'English',
        },
        {
          key: 'es',
          label: 'Spanish',
        },
      ],
    },
  ],
  templates: [template],
  entities: [
    {
      _id: new ObjectId(),
      title: 'correct_entity',
      sharedId: 'correct_entity_sharedId',
      template: template._id,
      language: 'en',
      metadata: {
        text: [
          {
            value: 'text',
          },
        ],
        select: [
          {
            value: 'A_id',
            label: 'A',
          },
        ],
        relationship: [
          {
            value: 'S_sharedId',
            label: 'S',
            type: 'entity',
          },
        ],
        inherited: [
          {
            value: 'S_sharedId',
            label: 'S',
            type: 'entity',
            inheritedValue: [
              {
                value: 'text',
              },
            ],
            inheritedType: 'text',
          },
        ],
      },
    },
    {
      _id: new ObjectId(),
      title: 'correct_entity_es',
      sharedId: 'correct_entity_sharedId',
      template: template._id,
      language: 'es',
      metadata: {
        text: [
          {
            value: 'text_es',
          },
        ],
        select: [
          {
            value: 'A_id',
            label: 'A_es',
          },
        ],
        relationship: [
          {
            value: 'S_sharedId',
            label: 'S_es',
            type: 'entity',
          },
        ],
        inherited: [
          {
            value: 'S_sharedId',
            label: 'S_es',
            type: 'entity',
            inheritedValue: [
              {
                value: 'text_es',
              },
            ],
            inheritedType: 'text',
          },
        ],
      },
    },
    {
      _id: new ObjectId(),
      title: 'entity_without_metadata',
      sharedId: 'entity_without_metadata_sharedId',
      template: template._id,
      language: 'en',
    },
    {
      _id: new ObjectId(),
      title: 'entity_without_metadata_es',
      sharedId: 'entity_without_metadata_sharedId',
      template: template._id,
      language: 'es',
    },
    {
      _id: new ObjectId(),
      title: 'entity_with_undefined_metadata',
      sharedId: 'entity_with_undefined_metadata_sharedId',
      template: template._id,
      language: 'en',
      metadata: undefined,
    },
    {
      _id: new ObjectId(),
      title: 'entity_with_undefined_metadata_es',
      sharedId: 'entity_with_undefined_metadata_sharedId',
      template: template._id,
      language: 'es',
      metadata: undefined,
    },
    {
      _id: new ObjectId(),
      title: 'entity_with_null_metadata',
      sharedId: 'entity_with_null_metadata_sharedId',
      template: template._id,
      language: 'en',
      //@ts-ignore
      metadata: null,
    },
    {
      _id: new ObjectId(),
      title: 'entity_with_null_metadata_es',
      sharedId: 'entity_with_null_metadata_sharedId',
      template: template._id,
      language: 'es',
      //@ts-ignore
      metadata: null,
    },
    {
      _id: new ObjectId(),
      title: 'entity_with_empty_metadata',
      sharedId: 'entity_with_empty_metadata_sharedId',
      template: template._id,
      language: 'en',
      metadata: {},
    },
    {
      _id: new ObjectId(),
      title: 'entity_with_empty_metadata_es',
      sharedId: 'entity_with_empty_metadata_sharedId',
      template: template._id,
      language: 'es',
      metadata: {},
    },
    {
      _id: new ObjectId(),
      title: 'entity_with_undefined_metadata_properties',
      sharedId: 'entity_with_undefined_metadata_properties_sharedId',
      template: template._id,
      language: 'en',
      metadata: {
        //@ts-ignore
        text: undefined,
        //@ts-ignore
        select: undefined,
        //@ts-ignore
        relationship: undefined,
        //@ts-ignore
        inherited: undefined,
      },
    },
    {
      _id: new ObjectId(),
      title: 'entity_with_undefined_metadata_properties_es',
      sharedId: 'entity_with_undefined_metadata_properties_sharedId',
      template: template._id,
      language: 'es',
      metadata: {
        //@ts-ignore
        text: undefined,
        //@ts-ignore
        select: undefined,
        //@ts-ignore
        relationship: undefined,
        //@ts-ignore
        inherited: undefined,
      },
    },
    {
      _id: new ObjectId(),
      title: 'entity_with_null_metadata_properties',
      sharedId: 'entity_with_null_metadata_properties_sharedId',
      template: template._id,
      language: 'en',
      metadata: {
        //@ts-ignore
        text: null,
        //@ts-ignore
        select: null,
        //@ts-ignore
        relationship: null,
        //@ts-ignore
        inherited: null,
      },
    },
    {
      _id: new ObjectId(),
      title: 'entity_with_null_metadata_properties_es',
      sharedId: 'entity_with_null_metadata_properties_sharedId',
      template: template._id,
      language: 'es',
      metadata: {
        //@ts-ignore
        text: null,
        //@ts-ignore
        select: null,
        //@ts-ignore
        relationship: null,
        //@ts-ignore
        inherited: null,
      },
    },
    {
      _id: new ObjectId(),
      title: 'entity_with_empty_metadata_properties',
      sharedId: 'entity_with_empty_metadata_properties_sharedId',
      template: template._id,
      language: 'en',
      metadata: {
        text: [],
        select: [],
        relationship: [],
        inherited: [],
      },
    },
    {
      _id: new ObjectId(),
      title: 'entity_with_empty_metadata_properties_es',
      sharedId: 'entity_with_empty_metadata_properties_sharedId',
      template: template._id,
      language: 'es',
      metadata: {
        text: [],
        select: [],
        relationship: [],
        inherited: [],
      },
    },
    {
      _id: new ObjectId(),
      title: 'entity_with_missing_inherited_value',
      sharedId: 'entity_with_missing_inherited_value_sharedId',
      template: template._id,
      language: 'en',
      metadata: {
        text: [],
        select: [],
        relationship: [],
        inherited: [
          {
            value: 'S_sharedId',
            label: 'S',
            type: 'entity',
            inheritedType: 'text',
          },
        ],
      },
    },
    {
      _id: new ObjectId(),
      title: 'entity_with_missing_inherited_value_es',
      sharedId: 'entity_with_missing_inherited_value_sharedId',
      template: template._id,
      language: 'es',
      metadata: {
        text: [],
        select: [],
        relationship: [],
        inherited: [
          {
            value: 'S_sharedId',
            label: 'S_es',
            type: 'entity',
            inheritedType: 'text',
          },
        ],
      },
    },
    {
      id: new ObjectId(),
      title: 'entity_with_assymetric_case',
      sharedId: 'entity_with_assymetric_case_sharedId',
      template: template._id,
      language: 'en',
      metadata: {
        text: [],
        select: [],
        relationship: [],
        inherited: [
          {
            value: 'S_sharedId',
            label: 'S',
            type: 'entity',
            inheritedValue: [],
            inheritedType: 'text',
          },
        ],
      },
    },
    {
      id: new ObjectId(),
      title: 'entity_with_assymetric_case_es',
      sharedId: 'entity_with_assymetric_case_sharedId',
      template: template._id,
      language: 'es',
      metadata: {
        //@ts-ignore
        select: undefined,
        //@ts-ignore
        relationship: null,
        inherited: [
          {
            value: 'S_sharedId',
            label: 'S_es',
            type: 'entity',
            //@ts-ignore
            inheritedValue: null,
            inheritedType: 'text',
          },
        ],
      },
    },
  ],
};

export { fixtures };
