
import validator, {required} from '../validator';

describe('metadata validator', () => {
  let fieldsTemplate = [
    {name: 'field1', label: 'label1', required: true},
    {name: 'field2', label: 'label2', type: 'select', content: 'thesauriId'},
    {name: 'field3', label: 'label3', required: true}
  ];

  let template = {name: 'template1', _id: 'templateId', properties: fieldsTemplate};

  describe('required', () => {
    it('should return false on an empty string', () => {
      expect(required('')).toBe(false);
      expect(required('  ')).toBe(false);
      expect(required('value')).toBe(true);
    });
  });

  describe('generate', () => {
    it('should should generate an validation based on the template passed', () => {
      let validationObject = validator.generate(template);
      expect(validationObject.title).toEqual({required});
      expect(validationObject['metadata.field1']).toEqual({required});
      expect(validationObject['metadata.field3']).toEqual({required});
    });
  });
});
