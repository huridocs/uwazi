"use strict";
var _validator = _interopRequireWildcard(require("../validator"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

describe('metadata validator', () => {
  const fieldsTemplate = [
  { name: 'field1', label: 'label1', required: true },
  { name: 'field2', label: 'label2', type: 'select', content: 'thesauriId' },
  { name: 'field3', label: 'label3', required: true }];


  const template = { name: 'template1', _id: 'templateId', properties: fieldsTemplate };

  describe('required', () => {
    it('should return false on an empty string', () => {
      expect((0, _validator.notEmpty)('')).toBe(false);
      expect((0, _validator.notEmpty)('  ')).toBe(false);
      expect((0, _validator.notEmpty)({})).toBe(false);
      expect((0, _validator.notEmpty)([])).toBe(false);
      expect((0, _validator.notEmpty)('value')).toBe(true);
      expect((0, _validator.notEmpty)(null)).toBe(false);
      expect((0, _validator.notEmpty)(423)).toBe(true);
      expect((0, _validator.notEmpty)(0)).toBe(true);
    });

    it('should return false on an empty array', () => {
      expect((0, _validator.notEmpty)([])).toBe(false);
    });
  });

  describe('generate', () => {
    it('should should generate a validation based on the template passed', () => {
      const validationObject = _validator.default.generate(template);
      expect(validationObject.title).toEqual({ required: _validator.notEmpty });
      expect(validationObject['metadata.field1']).toEqual({ required: _validator.notEmpty });
      expect(validationObject['metadata.field3']).toEqual({ required: _validator.notEmpty });
    });
  });
});