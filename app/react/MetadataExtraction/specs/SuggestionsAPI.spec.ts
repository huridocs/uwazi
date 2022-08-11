import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import {
  getSuggestions,
  trainModel,
  ixStatus,
  acceptEntitySuggestion,
} from 'app/MetadataExtraction/SuggestionsAPI';

describe('SuggestionsAPI', () => {
  describe('getSuggestions', () => {
    it('should return the fetched suggestions and the total of pages', async () => {
      const request = new RequestParams();
      const expected = { suggestions: [{ propertyName: 'property1' }], totalPages: 3 };
      spyOn(api, 'get').and.callFake(async () => Promise.resolve({ json: { ...expected } }));
      const result = await getSuggestions(request);
      expect(result).toEqual(expected);
    });
  });

  describe('trainModel', () => {
    it('should return the result of the training', async () => {
      const request = new RequestParams();
      spyOn(api, 'post').and.callFake(async () => Promise.resolve({ json: 'data' }));
      const result = await trainModel(request);
      expect(result).toEqual('data');
    });
  });

  describe('status', () => {
    it('should return the status of the training', async () => {
      const request = new RequestParams();
      spyOn(api, 'get').and.callFake(async () => Promise.resolve({ json: 'data' }));
      const result = await ixStatus(request);
      expect(result).toEqual('data');
    });
  });

  describe('acceptEntitySuggestion', () => {
    it('should return the result of accepting the suggestion', async () => {
      const request = new RequestParams();
      spyOn(api, 'post').and.callFake(async () => Promise.resolve({ json: 'success' }));
      const result = await acceptEntitySuggestion(request);
      expect(result).toEqual('success');
    });
  });
});
