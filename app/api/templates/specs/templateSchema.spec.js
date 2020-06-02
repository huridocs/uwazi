/** @format */

import Ajv from 'ajv';
import db from 'api/utils/testing_db';
import { catchErrors } from 'api/utils/jasmineHelpers';
import { validateTemplate } from '../../../shared/types/templateSchema';
import fixtures, {
  templateId,
  templateToBeInherited,
  propertyToBeInherited,
} from './validatorFixtures';

describe('template schema', () => {
  beforeEach(done => {
    db.clearAllAndLoad(fixtures)
      .then(done)
      .catch(catchErrors(done));
  });

  afterAll(done => {
    db.disconnect().then(done);
  });

  describe('validateTemplate', () => {
    let template;

    const makeProperty = (name, type, args) => ({
      name,
      type,
      id: name,
      label: name,
      isCommonProperty: false,
      prioritySorting: false,
      ...args,
    });

    beforeEach(() => {
      template = {
        name: 'Test',
        commonProperties: [makeProperty('title', 'text'), makeProperty('creationDate', 'date')],
        properties: [
          makeProperty('daterange', 'daterange'),
          makeProperty('geolocation', 'geolocation'),
          makeProperty('image', 'image'),
          makeProperty('link', 'link'),
          makeProperty('markdown', 'markdown', { required: true }),
          makeProperty('media', 'media', { fullWidth: true }),
          makeProperty('multidate', 'multidate'),
          makeProperty('multidaterange', 'multidaterange'),
          makeProperty('multiselect', 'multiselect', { content: 'content', filter: true }),
          makeProperty('nested', 'nested'),
          makeProperty('numeric', 'numeric', { showInCard: true, defaultfilter: true }),
          makeProperty('preview', 'preview'),
          makeProperty('relationship', 'relationship', { relationType: 'rel', content: '' }),
          makeProperty('inherited_rel', 'relationship', {
            relationType: 'otherRel',
            inherit: true,
            inheritProperty: 'prop',
          }),
          makeProperty('select', 'select', { content: 'content' }),
          makeProperty('text', 'text', { sortable: true }),
        ],
      };
    });

    const testValid = () => validateTemplate(template);

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
      it('should not require properties to have a name', async () => {
        const prop = makeProperty('nameless', 'text');
        delete prop.name;
        template.properties.push(prop);
        await testValid();
      });
      it('should not throw error if updating same template with same name', async () => {
        template.name = 'DuplicateName';
        template._id = templateId.toString();
        await testValid();
      });
    });

    describe('invalid cases', () => {
      it('invalid if commonProperties is empty', async () => {
        template.commonProperties = [];
        await testInvalid();
      });

      it('invalid if title property does not exist', async () => {
        template.commonProperties = [makeProperty('creationDate', 'date')];
        await testInvalid();
      });

      it('invalid when property has unknown data type', async () => {
        template.properties[0].type = 'unknown';
        await testInvalid();
      });

      it('invalid if properties have similar labels', async () => {
        template.properties.push(makeProperty('foo', 'numeric', { label: 'My Label' }));
        template.properties.push(makeProperty('bar', 'text', { label: 'my label' }));
        await testInvalid();
      });

      it('invalid if properties and common properties have similar labels', async () => {
        template.properties.push(makeProperty('bar', 'text', { label: 'title' }));
        await testInvalid();
      });

      it('invalid if select property does not have a content field', async () => {
        template.properties.push(makeProperty('foo', 'select'));
        await testInvalid();
      });

      it('invalid if multiselect property does not have a content field', async () => {
        template.properties.push(makeProperty('foo', 'multiselect'));
        await testInvalid();
      });

      it('invalid if relationship property does not have a relationtype field', async () => {
        template.properties.push(makeProperty('foo', 'relationship', { content: 'content' }));
        await testInvalid();
      });

      it('invalid if inherited relationship properties do not specify field to inherit', async () => {
        template.properties.push(
          makeProperty('foo', 'relationship', {
            content: 'content',
            relationType: 'rel1',
            inherit: true,
          })
        );
        await testInvalid();
      });

      it('invalid if different table with the same name already exists', async () => {
        template.name = 'DuplicateName';
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
});
