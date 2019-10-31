import Ajv from 'ajv';
import db from 'api/utils/testing_db';
import { catchErrors } from 'api/utils/jasmineHelpers';
import validator from '../templatesValidator';
import fixtures, { templateId } from './validatorFixtures';


describe('template validator', () => {
  beforeEach((done) => {
    db.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
  });

  afterAll((done) => {
    db.disconnect().then(done);
  });

  describe('save', () => {
    let template;

    const makeProperty = (name, type, args) => ({
      name,
      type,
      id: name,
      label: name,
      isCommonProperty: false,
      prioritySorting: false,
      ...args
    });

    beforeEach(() => {
      template = {
        name: 'Test',
        commonProperties: [
          makeProperty('title', 'text'),
          makeProperty('creationDate', 'date')
        ],
        properties: [
          makeProperty('geolocation', 'geolocation'),
          makeProperty('image', 'image'),
          makeProperty('markdown', 'markdown', { required: true }),
          makeProperty('media', 'media', { fullWidth: true }),
          makeProperty('multidate', 'multidate'),
          makeProperty('multidaterange', 'multidaterange'),
          makeProperty('multiselect', 'multiselect', { content: 'content', filter: true }),
          makeProperty('numeric', 'numeric', { showInCard: true, defaultfilter: true }),
          makeProperty('relationship', 'relationship', { content: 'content', relationType: 'rel' }),
          makeProperty('inherited_rel', 'relationship', {
            content: 'content', relationType: 'otherRel', inherit: true, inheritProperty: 'prop'
          }),
          makeProperty('select', 'select', { content: 'content' }),
          makeProperty('text', 'text', { sortable: true })
        ]
      };
    });

    const testValid = () => validator.save(template, 'en');

    const testInvalid = async () => {
      try {
        await validator.save(template, 'en');
        fail('should throw error');
      } catch(e) {
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
        template.name = 'DuplicateName',
        template._id = templateId.toString();
        await testValid();
      });
    });

    describe('invalid cases', () => {
      it('invalid if commonProperties is empty', async () => {
        template.commonProperties = [];
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

      it('invalid if relationship property does not have a content field', async () => {
        template.properties.push(makeProperty('foo', 'relationship', { relationType: 'aRel' }));
        await testInvalid();
      });

      it('invalid if relationship property does not have a relationtype field', async () => {
        template.properties.push(makeProperty('foo', 'relationship', { content: 'content' }));
        await testInvalid();
      });

      it('invalid if relationship properties have same relationType', async () => {
        template.properties.push(makeProperty('foo', 'relationship', { content: 'content', relationType: 'rel1' }));
        template.properties.push(makeProperty('bar', 'relationship', { content: 'content', relationType: 'rel1' }));
        await testInvalid();
      });

      it('invalid if inherited relationship properties do not specify field to inherit', async () => {
        template.properties.push(makeProperty('foo', 'relationship', {
          content: 'content', relationType: 'rel1', inherit: true
        }));
        await testInvalid();
      });

      it('invalid if different table with the same name already exists', async () => {
        template.name = 'DuplicateName';
        await testInvalid();
      });
    });
  });
});
