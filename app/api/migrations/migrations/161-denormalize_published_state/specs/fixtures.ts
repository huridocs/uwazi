import { ObjectId } from 'mongodb';
import { Fixture } from '../types';

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

const unpublishedSourceTitle1 = 'unpublishedDoc1';

const unchangedFixtures: Fixture = {
  templates: [sourceTemplate],
  entities: [
    {
      _id: new ObjectId(),
      title: unpublishedSourceTitle1,
      sharedId: unpublishedSourceTitle1,
      language: 'en',
      template: sourceTemplate._id,
      published: false,
      metadata: {
        text_property: [{ value: 'A', label: 'A' }],
      },
    },
  ],
};

const sourceTemplate2 = {
  _id: new ObjectId(),
  name: 'source_template_2',
  properties: [
    {
      _id: new ObjectId(),
      label: 'Text Property',
      name: 'text_property',
      type: 'text' as 'text',
    },
  ],
};

const templateWithRelationship = {
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
};

const templateWithTwoRelationships = {
  _id: new ObjectId(),
  name: 'Template With Two Relationships',
  properties: [
    {
      _id: new ObjectId(),
      label: 'Relationship To Source',
      name: 'relationship_to_source',
      type: 'relationship' as 'relationship',
      content: sourceTemplate._id.toString(),
    },
    {
      _id: new ObjectId(),
      label: 'Relationship To Source 2',
      name: 'relationship_to_source_2',
      type: 'relationship' as 'relationship',
      content: sourceTemplate2._id.toString(),
    },
  ],
};

const unpublishedSourceTitle2 = 'unpublishedDoc2';

const publishedSourceTitle1 = 'publishedDoc1';

const publishedSourceTitle2 = 'publishedDoc2';

const fixtures: Fixture = {
  templates: [...unchangedFixtures.templates, sourceTemplate2, templateWithTwoRelationships],
  entities: [
    ...unchangedFixtures.entities,
    {
      _id: new ObjectId(),
      title: unpublishedSourceTitle2,
      sharedId: unpublishedSourceTitle2,
      language: 'en',
      template: sourceTemplate2._id,
      published: false,
      metadata: {
        text_property: [{ value: 'B', label: 'B' }],
      },
    },
    {
      _id: new ObjectId(),
      title: publishedSourceTitle1,
      sharedId: publishedSourceTitle1,
      language: 'en',
      template: sourceTemplate._id,
      published: true,
      metadata: {
        text_property: [{ value: 'C', label: 'C' }],
      },
    },
    {
      _id: new ObjectId(),
      title: publishedSourceTitle2,
      sharedId: publishedSourceTitle2,
      language: 'en',
      template: sourceTemplate2._id,
      published: true,
      metadata: {
        text_property: [{ value: 'D', label: 'D' }],
      },
    },
    {
      _id: new ObjectId(),
      title: 'docWithOneRelationship',
      sharedId: 'docWithOneRelationship',
      language: 'en',
      template: templateWithRelationship._id,
      published: true,
      metadata: {
        relationship_to_source: [
          { value: publishedSourceTitle1, label: publishedSourceTitle1 },
          { value: unpublishedSourceTitle1, label: unpublishedSourceTitle1 },
        ],
      },
    },
    {
      id: new ObjectId(),
      title: 'docWithTwoRelationships',
      sharedId: 'docWithTwoRelationships',
      language: 'en',
      template: templateWithTwoRelationships._id,
      published: true,
      metadata: {
        relationship_to_source: [
          { value: publishedSourceTitle1, label: publishedSourceTitle1 },
          { value: unpublishedSourceTitle1, label: unpublishedSourceTitle1 },
        ],
        relationship_to_source_2: [
          { value: publishedSourceTitle2, label: publishedSourceTitle2 },
          { value: unpublishedSourceTitle2, label: unpublishedSourceTitle2 },
        ],
      },
    },
  ],
};

export { fixtures, unchangedFixtures };
