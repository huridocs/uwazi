import JSONUtils from '../JSONUtils';

describe('JSONUtils', () => {
  describe('parseNested', () => {
    it('should parse a basic json to object', () => {
      const object = 'this is not a json';
      expect(JSONUtils.parseNested(object)).toEqual('this is not a json');
    });

    it('should parse a basic json to object', () => {
      const object = {test: 'test'};
      expect(JSONUtils.parseNested(object)).toEqual({test: 'test'});
    });

    it('should parse a nested object to object', () => {
      const object = {test: 'test', nested: '{"nestedProp": "nestedValue"}'};
      expect(JSONUtils.parseNested(object)).toEqual({test: 'test', nested: {nestedProp: 'nestedValue'}});
    });
  });
});
