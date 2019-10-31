import validator from '../templatesValidator';

describe('template validator', () => {
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

    const testValid = () => {
      validator.save(template, 'en');
    }

    const testInvalid = () => expect(() => validator.save(template, 'en')).toThrowError();

    describe('valid cases', () => {
      it('should return true if the template is valid', () => {
        testValid();
      });
      it('should return true if property array is empty', () => {
        template.properties = [];
        testValid();
      });
    });

    describe('invalid cases', () => {
      it('invalid if commonProperties is empty', () => {
        template.commonProperties = [];
        testInvalid();
      });

      it('invalid when property has unknown data type', () => {
        template.properties[0].type = 'unknown';
        testInvalid();
      });

      it('invalid if properties have similar labels', () => {
        template.properties.push(makeProperty('foo', 'numeric', { label: 'My Label' }));
        template.properties.push(makeProperty('bar', 'text', { label: 'my label' }));
        testInvalid();
      });

      it('invalid if properties and common properties have similar labels', () => {
        template.properties.push(makeProperty('bar', 'text', { label: 'title' }));
        testInvalid();
      });

      it('invalid if select property does not have a content field', () => {
        template.properties.push(makeProperty('foo', 'select'));
        testInvalid();
      });

      it('invalid if multiselect property does not have a content field', () => {
        template.properties.push(makeProperty('foo', 'multiselect'));
        testInvalid();
      });

      it('invalid if relationship property does not have a content field', () => {
        template.properties.push(makeProperty('foo', 'relationship', { relationType: 'aRel' }));
        testInvalid();
      });

      it('invalid if relationship property does not have a relationtype field', () => {
        template.properties.push(makeProperty('foo', 'relationship', { content: 'content' }));
        testInvalid();
      });

      it('invalid if relationship properties have same relationType', () => {
        template.properties.push(makeProperty('foo', 'relationship', { content: 'content', relationType: 'rel1' }));
        template.properties.push(makeProperty('bar', 'relationship', { content: 'content', relationType: 'rel1' }));
        testInvalid();
      });

      it('invalid if inherited relationship properties do not specify field to inherit', () => {
        template.properties.push(makeProperty('foo', 'relationship', {
          content: 'content', relationType: 'rel1', inherit: true
        }));
        testInvalid();
      });
    });
  });
});
