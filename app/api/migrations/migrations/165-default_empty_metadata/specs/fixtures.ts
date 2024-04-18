import { ObjectId } from 'mongodb';
import { Entity, Fixture, Settings, Template } from '../types';

const thesauriId = new ObjectId();
const relTypeId = new ObjectId();
const sourceTemplateId = new ObjectId();

const settings: Settings[] = [
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
];

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
  ],
  entityViewPage: '',
  name: 'test_template',
  _id: new ObjectId(),
};

const template2: Template = {
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
  ],
  entityViewPage: '',
  name: 'test_template2',
  _id: new ObjectId(),
};

const templates: Template[] = [template, template2];

const correctEntities: Entity[] = [
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
    },
  },
];

const correctFixtures: Fixture = {
  settings,
  templates,
  entities: correctEntities,
};

const fixtures: Fixture = {
  settings,
  templates,
  entities: [
    correctEntities[0],
    correctEntities[1],
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
      },
    },
    {
      _id: new ObjectId(),
      title: 'entity_with_assymetric_metadata',
      sharedId: 'entity_with_assymetric_metadata_sharedId',
      template: template._id,
      language: 'en',
      metadata: {
        text: [],
        select: [],
        relationship: [],
      },
    },
    {
      _id: new ObjectId(),
      title: 'entity_with_assymetric_metadata_es',
      sharedId: 'entity_with_assymetric_metadata_sharedId',
      template: template._id,
      language: 'es',
      metadata: {
        //@ts-ignore
        select: undefined,
        //@ts-ignore
        relationship: null,
      },
    },
    {
      _id: new ObjectId(),
      title: 'other_template',
      sharedId: 'other_template_sharedId',
      template: template2._id,
      language: 'en',
      metadata: {
        //@ts-ignore
        select: null,
      },
    },
    {
      _id: new ObjectId(),
      title: 'other_template_es',
      sharedId: 'other_template_sharedId',
      template: template2._id,
      language: 'es',
      metadata: {
        text: [],
      },
    },
  ],
};

export { fixtures, correctFixtures };
