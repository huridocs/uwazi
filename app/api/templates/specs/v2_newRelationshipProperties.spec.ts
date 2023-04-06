import { ObjectId } from 'mongodb';

import { ValidationError } from 'api/common.v2/validation/ValidationError';
import db, { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { TemplateSchema } from 'shared/types/templateType';
import templates from '../templates';

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
            query: [{ direction: 'out', types: [], match: [{ templates: [] }] }],
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
        query: [{ direction: 'out', types: [], match: [{ templates: [], traverse: [] }] }],
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
});
