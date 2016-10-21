import referencesUtils from '../referencesUtils';

describe('referencesUtils', () => {
  describe('filterRelevant', () => {
    it('should exclude other language and outbound metadata references', () => {
      const references = [
        {_id: '1', connectedDocument: '1'},
        {_id: 'filteredOut1', inbound: false, sourceType: 'metadata'},
        {_id: '2', connectedDocument: '2'},
        {_id: 'filteredOut2', language: 'en'}
      ];
      expect(referencesUtils.filterRelevant(references, 'es')).toEqual([references[0], references[2]]);
    });
  });
});
