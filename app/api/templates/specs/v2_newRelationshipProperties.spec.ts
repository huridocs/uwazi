import { ObjectId } from 'mongodb';

import { ValidationError } from 'api/common.v2/validation/ValidationError';
import entities from 'api/entities';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import db, { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { elasticTesting } from 'api/utils/elastic_testing';
import { EntityRelationshipsUpdateService } from 'api/entities.v2/services/EntityRelationshipsUpdateService';
import templates from '../templates';

jest.mock('api/entities.v2/services/EntityRelationshipsUpdateService');

const fixtureFactory = getFixturesFactory();

const commonProperties = fixtureFactory.commonProperties();

const oldQueryInDb = [
  {
    direction: 'out',
    types: [fixtureFactory.id('relation')],
    match: [
      {
        templates: [fixtureFactory.id('unrelated_template')],
        traverse: [],
      },
    ],
  },
];

const oldQueryInInput = [
  {
    direction: 'out',
    types: [fixtureFactory.id('relation').toString()],
    match: [
      {
        templates: [fixtureFactory.id('unrelated_template').toString()],
        traverse: [],
      },
    ],
  },
];

const fixtures: DBFixture = {
  relationtypes: [fixtureFactory.relationType('relation')],
  templates: [
    fixtureFactory.template('existing_template', [
      fixtureFactory.property('a_text_property', 'text'),
    ]),
    fixtureFactory.template('template_with_existing_relationship', [
      fixtureFactory.property('existing_relationship', 'newRelationship', {
        query: oldQueryInDb,
      }),
    ]),
    fixtureFactory.template('unrelated_template', [
      fixtureFactory.property('a_text_property', 'text'),
    ]),
    fixtureFactory.template('unrelated_template2', [
      fixtureFactory.property('a_text_property', 'text'),
    ]),
  ],
  entities: [
    fixtureFactory.entity('entity1', 'existing_template'),
    fixtureFactory.entity('entity2', 'existing_template'),
    fixtureFactory.entity('entity3', 'unrelated_template'),
    fixtureFactory.entity('entity4', 'template_with_existing_relationship', {
      existing_relationship: [{ value: 'existing_value' }],
    }),
    fixtureFactory.entity('entity5', 'unrelated_template2'),
  ],
  relationships: [
    {
      _id: fixtureFactory.id('rel1'),
      from: { entity: 'entity1' },
      to: { entity: 'entity3' },
      type: fixtureFactory.id('relation'),
    },
    {
      _id: fixtureFactory.id('rel2'),
      from: { entity: 'entity2' },
      to: { entity: 'entity3' },
      type: fixtureFactory.id('relation'),
    },
    {
      _id: fixtureFactory.id('rel3'),
      from: { entity: 'entity4' },
      to: { entity: 'entity5' },
      type: fixtureFactory.id('relation'),
    },
  ],
  settings: [
    {
      _id: db.id(),
      site_name: 'Uwazi',
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
      ],
      features: {
        newRelationships: true,
      },
    },
  ],
};

const newQueryInput = [
  {
    direction: 'out',
    types: [fixtureFactory.id('relation').toString()],
    match: [
      {
        templates: [fixtureFactory.id('unrelated_template2').toString()],
        traverse: [],
      },
    ],
  },
];

const newQueryInDb = [
  {
    direction: 'out',
    types: [fixtureFactory.id('relation')],
    match: [
      {
        templates: [fixtureFactory.id('unrelated_template2')],
        traverse: [],
      },
    ],
  },
];

describe('template.save()', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures, 'v2_new_relationship_properties.index');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('on template creation', () => {
    it('should validate the property and correctly map it to the database', async () => {
      const newTemplate = {
        name: 'new template with new relationship',
        commonProperties,
        properties: [
          {
            label: 'New Relationship',
            name: 'new_relationship',
            type: 'newRelationship' as 'newRelationship',
            query: [
              {
                direction: 'out',
                types: [fixtureFactory.id('relation').toString()],
                match: [{ templates: [fixtureFactory.id('existing_template').toString()] }],
              },
            ],
          },
          { name: 'text1', label: 'Text1', type: 'text' as 'text' },
        ],
      };
      const template = await templates.save(newTemplate, 'en');
      expect(template.properties?.[0]).toEqual({
        _id: expect.any(ObjectId),
        type: 'newRelationship',
        label: 'New Relationship',
        name: 'new_relationship',
        query: [
          {
            direction: 'out',
            types: [fixtureFactory.id('relation')],
            match: [{ templates: [fixtureFactory.id('existing_template')], traverse: [] }],
          },
        ],
      });
      expect(template.properties?.[1].label).toBe('Text1');
    });

    it('should throw a validation error', async () => {
      const newTemplate = {
        name: 'template with invalid new relationship',
        commonProperties,
        properties: [
          {
            name: 'new_relationship',
            type: 'newRelationship' as 'newRelationship',
            label: 'New Relationship',
            query: [{}],
          },
        ],
      };
      try {
        await templates.save(newTemplate, 'en');
        throw new Error('should have thrown a validation error');
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe('on template update', () => {
    describe('when the property is new', () => {
      it('should validate the property and correctly map it to the database', async () => {
        const existingTemplates = await templates.get({ name: 'existing_template' });
        expect(existingTemplates.length).toBe(1);
        const existingTemplate = existingTemplates[0];
        const updatedTemplate = {
          ...existingTemplate,
          properties: [
            {
              label: 'New Relationship',
              name: 'new_relationship',
              type: 'newRelationship' as 'newRelationship',
              query: [
                {
                  direction: 'out',
                  types: [fixtureFactory.id('relation').toString()],
                  match: [{ templates: [fixtureFactory.id('existing_template').toString()] }],
                },
              ],
            },
            { name: 'text1', label: 'Text1', type: 'text' as 'text' },
          ],
        };
        const template = await templates.save(updatedTemplate, 'en');
        expect(template.properties).toEqual([
          {
            _id: expect.any(ObjectId),
            type: 'newRelationship',
            label: 'New Relationship',
            name: 'new_relationship',
            query: [
              {
                direction: 'out',
                types: [fixtureFactory.id('relation')],
                match: [{ templates: [fixtureFactory.id('existing_template')], traverse: [] }],
              },
            ],
          },
          {
            _id: expect.any(ObjectId),
            type: 'text',
            label: 'Text1',
            name: 'text1',
          },
        ]);
        expect(template.properties?.[1].label).toBe('Text1');
      });

      it('should throw a validation error', async () => {
        const [existingTemplate] = await templates.get({ name: 'existing_template' });
        const newTemplate = {
          ...existingTemplate,
          properties: [
            {
              name: 'new_relationship',
              type: 'newRelationship' as 'newRelationship',
              label: 'New Relationship',
              query: [{}],
            },
          ],
        };
        try {
          await templates.save(newTemplate, 'en');
          throw new Error('should have thrown a validation error');
        } catch (e) {
          expect(e).toBeInstanceOf(ValidationError);
        }
      });

      it('should mark the properties as obsolete metadata in entites', async () => {
        const [existingTemplates] = await templates.get({ name: 'existing_template' });
        const updatedTemplate = {
          ...existingTemplates,
          properties: [
            {
              label: 'New Relationship',
              name: 'new_relationship',
              type: 'newRelationship' as 'newRelationship',
              query: [
                {
                  direction: 'out',
                  types: [fixtureFactory.id('relation').toString()],
                  match: [{ templates: [fixtureFactory.id('unrelated_template').toString()] }],
                },
              ],
            },
            { name: 'text1', label: 'Text1', type: 'text' as 'text' },
          ],
        };
        await templates.save(updatedTemplate, 'en');
        const updaterMock = (<jest.Mock>EntityRelationshipsUpdateService).mock.instances[1].update;
        expect(updaterMock).toHaveBeenCalledWith(['entity1', 'entity2']);
      });
    });

    describe('when the property is deleted', () => {
      it('uwazi should normally delete the property and metadata', async () => {
        const [existingTemplate] = await templates.get({
          name: 'template_with_existing_relationship',
        });
        const updatedTemplate = {
          ...existingTemplate,
          properties: [],
        };
        const template = await templates.save(updatedTemplate, 'en');
        expect(template.properties).toEqual([]);

        const relatedEntities = await db.mongodb
          ?.collection('entities')
          .find({ template: existingTemplate._id })
          .toArray();

        expect(relatedEntities?.map(e => e.metadata)).toEqual([{}]);
      });
    });

    describe('when the property is updated', () => {
      it('on property name change, uwazi should normally update the property and metadata', async () => {
        const [existingTemplate] = await templates.get({
          name: 'template_with_existing_relationship',
        });
        const updatedTemplate = {
          ...existingTemplate,
          properties: [
            {
              ...existingTemplate.properties![0],
              _id: existingTemplate.properties![0]._id!.toString(),
              query: oldQueryInInput,
              label: 'new name',
              name: 'new_name',
            },
          ],
        };
        const template = await templates.save(updatedTemplate, 'en');
        expect(template.properties).toEqual([
          {
            _id: expect.any(ObjectId),
            type: 'newRelationship',
            label: 'new name',
            name: 'new_name',
            query: oldQueryInDb,
          },
        ]);

        const relatedEntities = await db.mongodb
          ?.collection('entities')
          .find({ template: existingTemplate._id })
          .toArray();

        expect(relatedEntities?.map(e => e.metadata)).toEqual([
          {
            new_name: [{ value: 'existing_value' }],
          },
        ]);
      });

      it('on query change, uwazi should save the query properly, and mark the metadata obsolete', async () => {
        const [existingTemplate] = await templates.get({
          name: 'template_with_existing_relationship',
        });
        const updatedTemplate = {
          ...existingTemplate,
          properties: [
            {
              ...existingTemplate.properties![0],
              _id: existingTemplate.properties![0]._id!.toString(),
              query: newQueryInput,
            },
          ],
        };
        const template = await templates.save(updatedTemplate, 'en');
        expect(template.properties).toEqual([
          {
            _id: expect.any(ObjectId),
            type: 'newRelationship',
            label: 'existing_relationship',
            name: 'existing_relationship',
            query: newQueryInDb,
          },
        ]);

        const relatedEntities = await db.mongodb
          ?.collection('entities')
          .find({ template: existingTemplate._id })
          .toArray();

        expect(relatedEntities?.map(e => e.obsoleteMetadata)).toMatchObject([
          ['existing_relationship'],
        ]);

        await elasticTesting.refresh();
        const indexed = (await elasticTesting.getIndexedEntities()).find(
          e => e.template === existingTemplate._id.toString()
        );
        expect(indexed?.obsoleteMetadata).toMatchObject(['existing_relationship']);
      });

      it('on denormalizedProperty change should throw an error and not change the metadata', async () => {
        const [existingTemplate] = await templates.get({
          name: 'template_with_existing_relationship',
        });
        const updatedTemplate = {
          ...existingTemplate,
          properties: [
            {
              ...existingTemplate.properties![0],
              _id: existingTemplate.properties![0]._id!.toString(),
              query: oldQueryInInput,
              denormalizedProperty: 'a_text_property',
            },
          ],
        };
        try {
          await templates.save(updatedTemplate, 'en');
          throw new Error('should have thrown a validation error');
        } catch (e) {
          expect(e.message).toBe(
            'Cannot update denormalized property of a relationship property. The following properties try to do so: existing_relationship'
          );
        }

        const relatedEntities = await db.mongodb
          ?.collection('entities')
          .find({ template: existingTemplate._id })
          .toArray();

        expect(relatedEntities?.map(e => e.metadata.existing_relationship)).toEqual([
          [{ value: 'existing_value' }],
        ]);
      });
    });
  });

  describe('on template deletion', () => {
    it('should throw an error, if the template is still used in any query', async () => {
      const [template] = await templates.get({
        name: 'unrelated_template',
      });
      const [entityUsing] = await entities.get({ template: template._id });
      await entities.delete(entityUsing.sharedId);
      await expect(templates.delete({ _id: template._id })).rejects.toThrow(
        'The template is still used in a relationship property query.'
      );
    });

    it('should delete the template, if it is not used in any query', async () => {
      const [template] = await templates.get({
        name: 'template_with_existing_relationship',
      });
      const [entityUsing] = await entities.get({ template: template._id });
      await entities.delete(entityUsing.sharedId);
      await templates.delete({ _id: template._id });
      const stillInDb = await templates.get({ _id: template._id });
      expect(stillInDb).toEqual([]);
    });
  });
});
