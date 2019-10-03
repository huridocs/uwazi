import { APIURL } from 'app/config.js';
import backend from 'fetch-mock';
import { RequestParams } from 'app/utils/RequestParams';
import pagesAPI from '../PagesAPI';

describe('pagesAPI', () => {
  const singleResponse = [{ pages: 'single' }];

  beforeEach(() => {
    backend.restore();
    backend
      .get(`${APIURL}pages?param=value`, { body: JSON.stringify([singleResponse]) })
      .get(`${APIURL}page?param=value`, { body: JSON.stringify(singleResponse) })
      .post(`${APIURL}pages`, { body: JSON.stringify({ backednResponse: 'post' }) })
      .delete(`${APIURL}pages?sharedId=id`, { body: JSON.stringify({ backednResponse: 'delete' }) });
  });

  afterEach(() => backend.restore());

  describe('get()', () => {
    it('should request for the page', async () => {
      const request = new RequestParams({ param: 'value' });
      const response = await pagesAPI.get(request);
      expect(response).toEqual([singleResponse]);
    });
  });

  describe('getById()', () => {
    it('should request for the page by id', async () => {
      const request = new RequestParams({ param: 'value' });
      const response = await pagesAPI.getById(request);
      expect(response).toEqual(singleResponse);
    });
  });

  describe('save()', () => {
    it('should post the document data to /pages', async () => {
      const request = new RequestParams({ title: 'document name' });
      const response = await pagesAPI.save(request);
      expect(JSON.parse(backend.lastOptions(`${APIURL}pages`).body)).toEqual({ title: 'document name' });
      expect(response).toEqual({ backednResponse: 'post' });
    });
  });

  describe('delete()', () => {
    it('should delete the document', async () => {
      const data = { sharedId: 'id' };
      const request = new RequestParams(data);
      const response = await pagesAPI.delete(request);
      expect(response).toEqual({ backednResponse: 'delete' });
    });
  });
});
