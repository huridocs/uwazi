"use strict";var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _fixturesParser = _interopRequireWildcard(require("./fixturesParser"));
var _activitylogParser = require("../activitylogParser");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Activitylog Parser', () => {
  beforeEach(async () => {
    await _testing_db.default.clearAllAndLoad(_fixturesParser.default);
  });

  afterAll(async () => {
    await _testing_db.default.disconnect();
  });

  describe('getSemanticData', () => {
    it('should report as beautified: false if no translation present for the route', async () => {
      const semanticData = await (0, _activitylogParser.getSemanticData)({ url: '/api/untraslated-route' });
      expect(semanticData.beautified).toBe(false);
    });

    describe('routes: /api/entities and /api/documents', () => {
      describe('method: POST', () => {
        it('should beautify as CREATE when no ID found', async () => {
          const semanticData = await (0, _activitylogParser.getSemanticData)(
          { method: 'POST', url: '/api/entities', body: `{"title":"New Entity","template":"${_fixturesParser.firstTemplate.toString()}"}` });


          expect(semanticData).toEqual({
            beautified: true,
            action: 'CREATE',
            description: 'Created entity / document',
            name: 'New Entity',
            extra: 'of type Existing Template' });

        });

        it('should beautify as UPDATE when ID found', async () => {
          const semanticData = await (0, _activitylogParser.getSemanticData)(
          { method: 'POST', url: '/api/entities', body: `{"sharedId":"m0asd0","title":"Existing Entity","template":"${_fixturesParser.firstTemplate.toString()}"}` });


          expect(semanticData).toEqual(expect.objectContaining({
            action: 'UPDATE',
            description: 'Updated entity / document',
            name: 'Existing Entity (m0asd0)' }));

        });

        it('should only report the template ID if no template found', async () => {
          const template = _testing_db.default.id();
          const semanticData = await (0, _activitylogParser.getSemanticData)(
          { method: 'POST', url: '/api/documents', body: `{"title":"New Document","template":"${template.toString()}"}` });


          expect(semanticData).toEqual(expect.objectContaining({ name: 'New Document', extra: `of type (${template.toString()})` }));
        });

        it('should allow uploaded documents without template', async () => {
          const semanticData = await (0, _activitylogParser.getSemanticData)({ method: 'POST', url: '/api/documents', body: '{"title":"New Document"}' });
          expect(semanticData).toEqual(expect.objectContaining({ extra: 'of type (unassigned)' }));
        });
      });

      describe('method: DELETE', () => {
        it('should beautify as DELETE', async () => {
          const semanticData = await (0, _activitylogParser.getSemanticData)(
          { method: 'DELETE', url: '/api/documents', query: '{"sharedId":"o9e07m5ni3h"}' });


          expect(semanticData).toEqual({
            beautified: true,
            action: 'DELETE',
            description: 'Deleted entity / document',
            name: 'o9e07m5ni3h' });

        });
      });
    });
  });
});