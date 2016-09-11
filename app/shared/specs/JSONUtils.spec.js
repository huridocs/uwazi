import JSONUtils from '../JSONUtils';

fdescribe('JSONUtils', () => {
  beforeEach(() => {
  });

  describe('parseNested', () => {
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
