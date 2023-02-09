import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import {
  getSuggestions,
  trainModel,
  ixStatus,
  acceptEntitySuggestion,
  createExtractor,
  deleteExtractors,
  getAllExtractors,
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
      spyOn(api, 'post').and.callFake(async () => Promise.resolve({ json: 'data' }));
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

  describe('getAllExtractors', () => {
    it('should return all the extractor', async () => {
      const request = new RequestParams();
      spyOn(api, 'get').and.returnValue(Promise.resolve({ json: 'success' }));
      const result = await getAllExtractors(request);
      expect(result).toEqual('success');
      expect(api.get).toHaveBeenCalledWith('ixextractors', expect.anything());
    });
  });

  describe('createExtractor', () => {
    it('should return extractor after saving', async () => {
      const request = new RequestParams();
      spyOn(api, 'post').and.returnValue(Promise.resolve({ json: 'success' }));
      const result = await createExtractor(request);
      expect(result).toEqual('success');
      expect(api.post).toHaveBeenCalledWith('ixextractors', expect.anything());
    });
  });

  describe('deleteExtractors', () => {
    it('should return result after delete', async () => {
      const request = new RequestParams();
      spyOn(api, 'delete').and.returnValue(Promise.resolve({ json: 'success' }));
      const result = await deleteExtractors(request);
      expect(result).toEqual('success');
    });
  });
});
