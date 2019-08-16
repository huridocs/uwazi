import backend from 'fetch-mock';
import SEMANTIC_SEARCH_URL from 'api/config/semanticsearch';

import api from '../api';

describe('semantic search API', () => {
  describe('processDocument', () => {
    it('should send the doc to the semantic search server', async () => {
      const args = { fullText: { 1: 'test' } };
      const results = ['res'];
      backend.restore();
      backend.post(SEMANTIC_SEARCH_URL, { status: 200, body: results });
      const res = await api.processDocument(args);
      expect(res).toEqual(results);
    });
  });
});
