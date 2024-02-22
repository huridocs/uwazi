import { ObjectId } from 'mongodb';
import { Fixture, Template } from '../types';

const sourceTemplate = {
  _id: new ObjectId(),
  name: 'source_template',
  properties: [
    {
      _id: new ObjectId(),
      label: 'Text Property',
      name: 'text_property',
      type: 'text' as 'text',
    },
  ],
};

const baseTemplates: Record<string, Template> = {
  source: sourceTemplate,
  withRelationship: {
    _id: new ObjectId(),
    name: 'Template With Relationship',
    properties: [
      {
        _id: new ObjectId(),
        label: 'Relationship To Source',
        name: 'relationship_to_source',
        type: 'relationship',
        content: sourceTemplate._id.toString(),
      },
    ],
  },
};

const unpublishedEntityTitle = 'unpublishedDoc';

const unchangedFixtures: Fixture = {
  templates: Object.values(baseTemplates),
  entities: [
    {
      _id: new ObjectId(),
      title: unpublishedEntityTitle,
      sharedId: unpublishedEntityTitle,
      language: 'en',
      template: baseTemplates.source._id,
      published: false,
      metadata: {
        text_property: [{ value: 'A', label: 'A' }],
      },
    },
    {
      _id: new ObjectId(),
      title: 'nonChangingEntity',
      sharedId: 'nonChangingEntity',
      language: 'en',
      template: baseTemplates.withRelationship._id,
      published: false,
      metadata: {
        relationship: [{ value: unpublishedEntityTitle, label: unpublishedEntityTitle }],
      },
    },
  ],
};

const fixtures: Fixture = {
  templates: {
    ...unchangedFixtures.templates,
  },
  entities: {
    ...unchangedFixtures.entities,
  },
};

export { fixtures, unchangedFixtures };
