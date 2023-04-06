import { ObjectId } from 'mongodb';

import { ValidationError } from 'api/common.v2/validation/ValidationError';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import db, { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { TemplateSchema } from 'shared/types/templateType';
import templates from '../templates';

const fixtureFactory = getFixturesFactory();

const commonProperties: TemplateSchema['commonProperties'] = [
  {
    label: 'Title',
    name: 'title',
    isCommonProperty: true,
    type: 'text',
  },
  {
    label: 'Date added',
    name: 'creationDate',
    isCommonProperty: true,
    type: 'date',
  },
  {
    label: 'Date modified',
    name: 'editDate',
    isCommonProperty: true,
    type: 'date',
  },
];

const fixtures: DBFixture = {
  relationtypes: [fixtureFactory.relationType('relation')],
  templates: [
    fixtureFactory.template('existing_template', []),
    fixtureFactory.template('template_with_existing_relationship', [
      fixtureFactory.property('existing_relationship', 'newRelationship', {
        query: [],
      }),
    ]),
    fixtureFactory.template('unrelated_template', []),
  ],
  entities: [
    fixtureFactory.entity('entity1', 'existing_template'),
    fixtureFactory.entity('entity2', 'existing_template'),
    fixtureFactory.entity('entity3', 'unrelated_template'),
    fixtureFactory.entity('entity4', 'template_with_existing_relationship', {
      existing_relationship: [{ value: 'existing_value' }],
    }),
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

describe('template.save()', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures, 'csv_loader.index');
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
        const [existingTemplates] = await templates.get({ name: 'existing_template' });
        const newTemplate = {
          ...existingTemplates,
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
                  match: [{ templates: [fixtureFactory.id('existing_template').toString()] }],
                },
              ],
            },
            { name: 'text1', label: 'Text1', type: 'text' as 'text' },
          ],
        };
        await templates.save(updatedTemplate, 'en');
        const allEntities = await db.mongodb?.collection('entities').find({}).toArray();
        expect(allEntities?.map(e => e.obsoleteMetadata)).toEqual([
          ['new_relationship'],
          ['new_relationship'],
          [],
          [],
        ]);
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
            query: [],
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
    });
  });
});
