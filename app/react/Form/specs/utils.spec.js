import {prepareTemplateFields} from 'app/Form';
import {generateValidation} from 'app/Form';
import {validate} from 'app/Form';

describe('Form Utils', () => {
  describe('prepareTemplateFields', () => {
    let fieldsTemplate;
    let template;
    let thesauris;

    beforeEach(() => {
      fieldsTemplate = [{name: 'field1', label: 'label1'}, {name: 'field2', label: 'label2', type: 'select', content: 'thesauriId'}];
      template = {name: 'template1', _id: '1', properties: fieldsTemplate};
      thesauris = [{_id: 'thesauriId', name: 'thesauri', values: [{label: 'option1', id: '1'}, {label: 'option2', id: '2'}]}];
    });

    it('assign options on every select field based on thesauri', () => {
      let preparedTemplate = prepareTemplateFields(template, thesauris);
      expect(preparedTemplate.properties[1].options).toEqual([{label: 'option1', value: '1'}, {label: 'option2', value: '2'}]);
    });
  });

  describe('validate', () => {
    it('should use validate.js and transform doted properties into an object', () => {
      let values = {title: '', nested: {first: '', second: ''}};
      let validations = {
        title: {presence: {message: 'error'}},
        'nested.first': {presence: {message: 'error'}},
        'nested.second': {presence: {message: 'error'}}
      };

      let result = validate(values, validations);

      expect(result.title[0]).toBe('Title error');
      expect(result.nested.first[0]).toBe('Nested first error');
      expect(result.nested.second[0]).toBe('Nested second error');
    });

    describe('when there is no errors', () => {
      it('should return an empty object', () => {
        let values = {title: '', nested: {first: '', second: ''}};
        let validations = {};
        let result = validate(values, validations);

        expect(result).toEqual({});
      });
    });
  });

  describe('generateValidation', () => {
    it('should generate a valite.js compatible object validation for fields passed', () => {
      let template = {properties: [{name: 'name1', required: true}, {name: 'name2'}, {name: 'name3', required: true}]};
      let validationObject = generateValidation(template);

      expect(validationObject).toEqual({name1: {presence: true}, name3: {presence: true}});
    });

    describe('when passing a prefix', () => {
      it('should append it to every property name', () => {
        let template = {properties: [{name: 'name1', required: true}, {name: 'name2'}, {name: 'name3', required: true}]};
        let validationObject = generateValidation(template, 'prefix.');

        expect(validationObject).toEqual({'prefix.name1': {presence: true}, 'prefix.name3': {presence: true}});
      });
    });
  });
});
