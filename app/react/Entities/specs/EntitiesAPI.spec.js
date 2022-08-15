import { APIURL } from 'app/config.js';
import backend from 'fetch-mock';
import { RequestParams } from 'app/utils/RequestParams';
import api from 'app/utils/api';
import entitiesAPI from '../EntitiesAPI';

describe('EntitiesAPI', () => {
  const arrayResponse = [{ entities: 'array' }];
  const searchResponse = [{ entities: 'search' }];
  const filteredSearchResult = [{ entities: 'Alfred' }];
  const singleResponse = [{ entities: 'single' }];
  const paramedResponse = [{ entities: 'paramed' }];
  const page2Text = { data: 'page 2 text' };
  const page1Text = { data: 'page 1 text' };

  beforeEach(() => {
    backend.restore();
    backend
      .get(`${APIURL}entities?param=1&include=%5B%22permissions%22%5D`, {
        body: JSON.stringify({ rows: arrayResponse }),
      })
      .get(`${APIURL}entities/search`, { body: JSON.stringify(searchResponse) })
      .get(`${APIURL}documents/page?sharedId=sharedId&page=2`, {
        body: JSON.stringify(page2Text),
      })
      .get(`${APIURL}documents/page?sharedId=sharedId&page=1`, {
        body: JSON.stringify(page1Text),
      })
      .get(`${APIURL}entities/uploads`, { body: JSON.stringify({ rows: 'uploads' }) })
      .get(`${APIURL}entities/count_by_template?templateId=templateId`, { body: JSON.stringify(1) })
      .get(`${APIURL}entities/search?searchTerm=Batman&joker=true`, {
        body: JSON.stringify(filteredSearchResult),
      })
      .get(`${APIURL}entities?_id=documentId&include=%5B%22permissions%22%5D`, {
        body: JSON.stringify({ rows: singleResponse }),
      })
      .get(`${APIURL}entities?param1=1&_id=documentId&include=%5B%22permissions%22%5D`, {
        body: JSON.stringify({ rows: paramedResponse }),
      })
      .delete(`${APIURL}entities?sharedId=id`, {
        body: JSON.stringify({ backednResponse: 'testdelete' }),
      })
      .post(`${APIURL}entities/bulkdelete`, {
        body: JSON.stringify({ backednResponse: 'testdeleteMultiple' }),
      })
      .post(`${APIURL}entities`, { body: JSON.stringify({ backednResponse: 'test' }) })
      .post(`${APIURL}entities/multipleupdate`, {
        body: JSON.stringify({ backednResponse: 'test multiple' }),
      });
  });

  afterEach(() => backend.restore());

  describe('uploads', () => {
    it('should request uploads', async () => {
      const response = await entitiesAPI.uploads();
      expect(response).toEqual('uploads');
    });
  });

  describe('pageRawText', () => {
    it('should get page_raw_page and return the text', async () => {
      const request = new RequestParams({ sharedId: 'sharedId', page: 2 });
      const text = await entitiesAPI.getRawPage(request);
      expect(text).toBe(page2Text.data);
    });

    it('should get page 1 by default', async () => {
      const request = new RequestParams({ sharedId: 'sharedId' });
      const text = await entitiesAPI.getRawPage(request);
      expect(text).toBe(page1Text.data);
    });
  });

  describe('get()', () => {
    it('should request entities', async () => {
      const request = new RequestParams({ param: '1' });
      const response = await entitiesAPI.get(request);
      expect(response).toEqual(arrayResponse);
    });

    describe('should include permissions', () => {
      it('should request for the thesauri', async () => {
        spyOn(api, 'get').and.callFake(async () => Promise.resolve({ json: { rows: [] } }));
        let request = new RequestParams({ _id: 'documentId' });
        await entitiesAPI.get(request);
        expect(api.get).toHaveBeenCalledWith('entities', request.add({ include: ['permissions'] }));

        request = new RequestParams({ _id: 'documentId', include: ['include'] });
        await entitiesAPI.get(request);
        expect(api.get).toHaveBeenCalledWith(
          'entities',
          request.add({ include: ['include', 'permissions'] })
        );
      });
    });

    describe('when passing an id', () => {
      it('should request for the thesauri', async () => {
        const request = new RequestParams({ _id: 'documentId' });
        const response = await entitiesAPI.get(request);
        expect(response).toEqual(singleResponse);
      });
    });

    describe('when passing params', () => {
      it('should add the params to the url', async () => {
        const request = new RequestParams({ param1: '1', _id: 'documentId' });
        const response = await entitiesAPI.get(request);
        expect(response).toEqual(paramedResponse);
      });
    });
  });

  describe('countByTemplate()', () => {
    it('should count_by_template', async () => {
      const request = new RequestParams({ templateId: 'templateId' });
      const response = await entitiesAPI.countByTemplate(request);
      expect(response).toEqual(1);
    });
  });

  describe('search()', () => {
    it('should search entities', async () => {
      const response = await entitiesAPI.search();
      expect(response).toEqual(searchResponse);
    });

    describe('when passing filters', () => {
      it('should search for it', async () => {
        const request = new RequestParams({ searchTerm: 'Batman', joker: true });
        const response = await entitiesAPI.search(request);
        expect(response).toEqual(filteredSearchResult);
      });
    });
  });

  describe('save()', () => {
    it('should post the document data to /entities', async () => {
      const entity = { name: 'document name' };
      const request = new RequestParams(entity);
      const response = await entitiesAPI.save(request);
      expect(JSON.parse(backend.lastOptions(`${APIURL}entities`).body)).toEqual(entity);
      expect(response).toEqual({ backednResponse: 'test' });
    });
  });

  describe('multipleUpdate()', () => {
    it('should post the ids and metadata to /entities/multipleupdate', async () => {
      const values = { metadata: { text: [{ value: 'document text' }] } };
      const ids = ['1', '2'];
      const request = new RequestParams({ values, ids });
      const response = await entitiesAPI.multipleUpdate(request);

      expect(JSON.parse(backend.lastOptions(`${APIURL}entities/multipleupdate`).body)).toEqual({
        ids,
        values,
      });
      expect(response).toEqual({ backednResponse: 'test multiple' });
    });
  });

  describe('delete()', () => {
    it('should delete the document', async () => {
      const data = { sharedId: 'id' };
      const request = new RequestParams(data);
      const response = await entitiesAPI.delete(request);

      expect(response).toEqual({ backednResponse: 'testdelete' });
    });
  });

  describe('deleteMultiple()', () => {
    it('should delete all the entities', async () => {
      const documents = [{ sharedId: 'id1' }, { sharedId: 'id2' }];
      const response = await entitiesAPI.deleteMultiple(new RequestParams(documents));

      expect(response).toEqual({ backednResponse: 'testdeleteMultiple' });
    });
  });
});
