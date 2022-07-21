/* eslint-disable max-lines */
import Ajv from 'ajv';
import db from 'api/utils/testing_db';
import { TemplateSchema } from 'shared/types/templateType';
import { PropertySchema } from 'shared/types/commonTypes';

import fixtures, {
  templateId,
  templateToBeInherited,
  propertyToBeInherited,
  thesauriId1,
  thesauriId2,
  thesauriId4,
} from './validatorFixtures';

import { safeName } from '../utils';
import { validateTemplate } from '../../../shared/types/templateSchema';

describe('template schema', () => {
  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('validateTemplate', () => {
    let template: TemplateSchema;

    const makeProperty = (label: string, type: PropertySchema['type'], args: object = {}) => ({
      label,
      name: safeName(label),
      type,
      isCommonProperty: false,
      prioritySorting: false,
      ...args,
    });

    beforeEach(() => {
      template = {
        name: 'Test',
        commonProperties: [makeProperty('title', 'text'), makeProperty('creationDate', 'date')],
        properties: [],
      };
    });

    const testValid = async () => validateTemplate(template);

    const testInvalid = async () => {
      try {
        await validateTemplate(template);
        fail('should throw error');
      } catch (e) {
        expect(e).toBeInstanceOf(Ajv.ValidationError);
      }
    };

    describe('valid cases', () => {
      it('should return true if the template is valid', async () => {
        await testValid();
      });
      it('should return true if property array is empty', async () => {
        template.properties = [];
        await testValid();
      });
      it('should not throw error if updating same template with same name', async () => {
        template.name = 'DuplicateName';
        template._id = templateId.toString();
        await testValid();
      });
    });

    // eslint-disable-next-line max-statements
    describe('invalid cases', () => {
      it('invalid if commonProperties is empty', async () => {
        //@ts-ignore
        template.commonProperties = [];
        await testInvalid();
      });

      it('invalid if title property does not exist', async () => {
        template.commonProperties = [makeProperty('creationDate', 'date')];
        await testInvalid();
      });

      it('invalid when property has unknown data type', async () => {
        //@ts-ignore
        template.properties.push({ name: 'test', type: 'unknown' });
        await testInvalid();
      });

      it('invalid if properties have the same generated name', async () => {
        template.properties = [];
        template.properties.push(makeProperty('my label', 'numeric'));
        template.properties.push(makeProperty('my_label', 'text', { id: 'same' }));
        template.properties.push(makeProperty('another label', 'text', { id: 'same' }));
        try {
          await validateTemplate(template);
          fail('should throw error');
        } catch (e) {
          expect(e).toBeInstanceOf(Ajv.ValidationError);
          expect(e.errors).toEqual([
            expect.objectContaining({
              message: 'duplicated property value { name: "my_label" }',
              instancePath: '.properties.name',
            }),
            expect.objectContaining({
              message: 'duplicated property value { id: "same" }',
              instancePath: '.properties.id',
            }),
          ]);
        }
      });

      it('invalid if properties and common properties have the same name', async () => {
        template.properties = [];
        template.properties.push(makeProperty('title', 'text'));
        await testInvalid();
      });

      it('invalid if select property does not have a content field', async () => {
        template.properties = [];
        template.properties.push(makeProperty('foo', 'select'));
        await testInvalid();
      });

      it('invalid if multiselect property does not have a content field', async () => {
        template.properties = [];
        template.properties.push(makeProperty('foo', 'multiselect'));
        await testInvalid();
      });

      it('invalid if select or multiselect property content does not exists', async () => {
        template.properties = [];
        template.properties.push(makeProperty('foo', 'multiselect', { content: db.id() }));
        await testInvalid();
      });

      it('invalid if relationship property does not have a relationtype field', async () => {
        template.properties = [];
        template.properties.push(makeProperty('foo', 'relationship', { content: 'content' }));
        await testInvalid();
      });

      it('invalid if different template with the same name already exists', async () => {
        template.name = 'DuplicateName';
        await testInvalid();
      });

      it('invalid if relationship property inherits something different', async () => {
        template.properties = [];
        template.properties.push({
          name: 'relationship',
          label: 'relationship',
          type: 'relationship',
          content: templateToBeInherited.toString(),
        });
        await testInvalid();
      });
    });
  });

  describe('cantDeleteInheritedProperties', () => {
    it('invalid when trying to delete an inherited property', async () => {
      const template = {
        _id: templateToBeInherited,
        name: 'changed name',
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        properties: [],
      };

      try {
        await validateTemplate(template);
        fail('should throw error');
      } catch (e) {
        expect(e).toBeInstanceOf(Ajv.ValidationError);
      }
    });

    it("should work with ID's stored as either strings or mongo ID's", async () => {
      const template = {
        _id: templateToBeInherited,
        name: 'changed name',
        commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
        properties: [
          {
            _id: propertyToBeInherited.toString(),
            name: 'inherit_me',
            type: 'text',
            label: 'Inherited',
          },
          { name: 'new_one', type: 'text', label: 'New one' },
        ],
      };

      await validateTemplate(template);
      expect(template.properties.length).toBe(2);
    });
  });

  describe('when there is another template with the same property', () => {
    const validatorKeyword = 'cantReuseNameWithDifferentType';
    const template = {
      name: 'template',
      properties: [
        {
          name: 'sharedproperty1',
          label: 'sharedProperty1',
          type: 'select',
          content: thesauriId2.toString(),
        },
        {
          name: 'sharedproperty2',
          label: 'sharedProperty2',
          type: 'select',
          content: thesauriId1.toString(),
        },
        {
          name: 'sharedproperty3',
          label: 'sharedProperty3',
          type: 'text',
        },
        {
          name: 'sharedrelationship1',
          label: 'sharedRelationship1',
          type: 'relationship',
          content: 'template1',
          relationType: 'relationType2',
        },
        {
          name: 'validproperty4',
          label: 'validProperty4',
          type: 'select',
          content: thesauriId4.toString(),
        },
        {
          name: 'validpropertydate',
          label: 'validPropertyDate',
          type: 'date',
        },
        {
          name: 'validpropertydaterange',
          label: 'validPropertyDateRange',
          type: 'daterange',
        },
        {
          name: 'validpropertymultiselect',
          label: 'validPropertyMultiSelect',
          type: 'multiselect',
          content: thesauriId4.toString(),
        },
        {
          name: 'validpropertymultidate',
          label: 'validPropertyMultiDate',
          type: 'multidate',
        },
        {
          name: 'validpropertymultidaterange',
          label: 'validPropertyMultiDateRange',
          type: 'multidaterange',
        },
        {
          name: 'validpropertyrichtext',
          label: 'validPropertyRichText',
          type: 'markdown',
        },
      ],
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
    };

    describe('when the property to save is of a different content', () => {
      it('should return the name of the duplicated properties', async () => {
        try {
          await validateTemplate(template);
          fail('should throw validation error');
        } catch (e) {
          expect(e).toBeInstanceOf(Ajv.ValidationError);

          expect(e.errors.length).toBe(4);
          expect(e).toHaveProperty(
            'errors',
            expect.arrayContaining([
              expect.objectContaining({
                instancePath: '.properties.sharedproperty1',
                keyword: validatorKeyword,
              }),
              expect.objectContaining({
                instancePath: '.properties.sharedproperty2',
                keyword: validatorKeyword,
              }),
              expect.objectContaining({
                instancePath: '.properties.sharedproperty3',
                keyword: validatorKeyword,
              }),
              expect.objectContaining({
                instancePath: '.properties.sharedrelationship1',
                keyword: validatorKeyword,
              }),
            ])
          );
        }
      });
    });
  });

  describe('when selecting an entity view page', () => {
    const template = {
      _id: templateId,
      name: 'My template',
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      properties: [],
      entityViewPage: 'iDontExist',
    };
    const template2 = {
      _id: templateId,
      name: 'My template',
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      properties: [],
      entityViewPage: 'iExistButImNotForEntityView',
    };

    it('should not allow selecting non existing pages', async () => {
      try {
        await validateTemplate(template);
        fail('it should not validate');
      } catch (e) {
        expect(e).toBeInstanceOf(Ajv.ValidationError);
      }
    });
    it('should not allow selecting pages that are not enabled for entity view', async () => {
      try {
        await validateTemplate(template2);
        fail('it should not validate');
      } catch (e) {
        expect(e).toBeInstanceOf(Ajv.ValidationError);
      }
    });
  });
});
