"use strict";var _JSONUtils = _interopRequireDefault(require("../JSONUtils"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('JSONUtils', () => {
  describe('parseNested', () => {
    it('should parse a basic json to object', () => {
      const object = 'this is not a json';
      expect(_JSONUtils.default.parseNested(object)).toEqual('this is not a json');
    });

    it('should parse a basic json to object', () => {
      const object = { test: 'test' };
      expect(_JSONUtils.default.parseNested(object)).toEqual({ test: 'test' });
    });

    it('should parse a nested object to object', () => {
      const object = { test: 'test', nested: '{"nestedProp": "nestedValue"}' };
      expect(_JSONUtils.default.parseNested(object)).toEqual({ test: 'test', nested: { nestedProp: 'nestedValue' } });
    });
  });
});