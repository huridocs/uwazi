"use strict";var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _semanticsearch = _interopRequireDefault(require("../../config/semanticsearch"));

var _api = _interopRequireDefault(require("../api"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('semantic search API', () => {
  describe('processDocument', () => {
    it('should send the doc to the semantic search server', async () => {
      const args = { fullText: { 1: 'test' } };
      const results = ['res'];
      _fetchMock.default.restore();
      _fetchMock.default.post(_semanticsearch.default, { status: 200, body: results });
      const res = await _api.default.processDocument(args);
      expect(res).toEqual(results);
    });
  });
});