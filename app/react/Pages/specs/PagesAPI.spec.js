import { APIURL } from 'app/config.js';
import backend from 'fetch-mock';
import { RequestParams } from 'app/utils/RequestParams';
import pagesAPI from '../PagesAPI';

describe('pagesAPI', () => {
  const singleResponse = [{ pages: 'single' }];

  async function requestFor(pagesAPIMethod, parameters) {
    const request = new RequestParams(parameters);
    const response = await pagesAPIMethod(request);
    return response;
  }

  beforeEach(() => {
    backend.restore();
    backend
      .get(`${APIURL}pages?param=value`, { body: JSON.stringify([singleResponse]) })
      .get(`${APIURL}page?param=id`, { body: JSON.stringify(singleResponse) })
      .post(`${APIURL}pages`, { body: JSON.stringify({ backendResponse: 'post' }) })
      .delete(`${APIURL}pages?sharedId=id`, {
        body: JSON.stringify({ backendResponse: 'delete' }),
      });
  });

  afterEach(() => backend.restore());

  describe('get()', () => {
    it('should request for the page', async () => {
      const response = await requestFor(pagesAPI.get, { param: 'value' });
      expect(response).toEqual([singleResponse]);
    });
  });

  describe('getById()', () => {
    it('should request for the page by id', async () => {
      const response = await requestFor(pagesAPI.getById, { param: 'id' });
      expect(response).toEqual(singleResponse);
    });
  });

  describe('save()', () => {
    it('should post the document data to /pages', async () => {
      const response = await requestFor(pagesAPI.save, { title: 'document name' });
      expect(JSON.parse(backend.lastOptions(`${APIURL}pages`).body)).toEqual({
        title: 'document name',
      });
      expect(response).toEqual({ backendResponse: 'post' });
    });
  });

  describe('delete()', () => {
    it('should delete the document', async () => {
      const data = { sharedId: 'id' };
      const response = await requestFor(pagesAPI.delete, data);
      expect(response).toEqual({ backendResponse: 'delete' });
    });
  });
});
