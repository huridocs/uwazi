import { APIURL } from 'app/config.js';
import backend from 'fetch-mock';

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
    .get(`${APIURL}entities`, { body: JSON.stringify({ rows: arrayResponse }) })
    .get(`${APIURL}entities/search`, { body: JSON.stringify(searchResponse) })
    .get(`${APIURL}entities/get_raw_page?sharedId=sharedId&pageNumber=2`, { body: JSON.stringify(page2Text) })
    .get(`${APIURL}entities/get_raw_page?sharedId=sharedId&pageNumber=1`, { body: JSON.stringify(page1Text) })
    .get(`${APIURL}entities/uploads`, { body: JSON.stringify({ rows: 'uploads' }) })
    .get(`${APIURL}entities/count_by_template?templateId=templateId`, { body: JSON.stringify(1) })
    .get(`${APIURL}entities/match_title?searchTerm=term`, { body: JSON.stringify(searchResponse) })
    .get(`${APIURL}entities/search?searchTerm=Batman&joker=true`, { body: JSON.stringify(filteredSearchResult) })
    .get(`${APIURL}entities?_id=documentId`, { body: JSON.stringify({ rows: singleResponse }) })
    .get(`${APIURL}entities?param1=1&_id=documentId`, { body: JSON.stringify({ rows: paramedResponse }) })
    .delete(`${APIURL}entities?sharedId=id`, { body: JSON.stringify({ backednResponse: 'testdelete' }) })
    .post(`${APIURL}entities/bulkdelete`, { body: JSON.stringify({ backednResponse: 'testdeleteMultiple' }) })
    .post(`${APIURL}entities`, { body: JSON.stringify({ backednResponse: 'test' }) })
    .post(`${APIURL}entities/multipleupdate`, { body: JSON.stringify({ backednResponse: 'test multiple' }) });
  });

  afterEach(() => backend.restore());

  describe('uploads', () => {
    it('should request uploads', (done) => {
      entitiesAPI.uploads()
      .then((response) => {
        expect(response).toEqual('uploads');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('pageRawText', () => {
    it('should get page_raw_page and return the text', async () => {
      const text = await entitiesAPI.getRawPage('sharedId', 2);
      expect(text).toBe(page2Text.data);
    });

    it('should get page 1 by default', async () => {
      const text = await entitiesAPI.getRawPage('sharedId');
      expect(text).toBe(page1Text.data);
    });
  });

  describe('get()', () => {
    it('should request entities', (done) => {
      entitiesAPI.get()
      .then((response) => {
        expect(response).toEqual(arrayResponse);
        done();
      })
      .catch(done.fail);
    });

    describe('when passing an id', () => {
      it('should request for the thesauri', (done) => {
        entitiesAPI.get('documentId')
        .then((response) => {
          expect(response).toEqual(singleResponse);
          done();
        })
        .catch(done.fail);
      });
    });

    describe('when passing params', () => {
      it('should add the params to the url', async () => {
        const response = await entitiesAPI.get('documentId', { param1: '1' });
        expect(response).toEqual(paramedResponse);
      });
    });
  });

  describe('getSuggestions()', () => {
    it('should match_title ', (done) => {
      entitiesAPI.getSuggestions('term')
      .then((response) => {
        expect(response).toEqual(searchResponse);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('countByTemplate()', () => {
    it('should count_by_template', (done) => {
      entitiesAPI.countByTemplate('templateId')
      .then((response) => {
        expect(response).toEqual(1);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('search()', () => {
    it('should search entities', (done) => {
      entitiesAPI.search()
      .then((response) => {
        expect(response).toEqual(searchResponse);
        done();
      })
      .catch(done.fail);
    });

    describe('when passing filters', () => {
      it('should search for it', (done) => {
        entitiesAPI.search({ searchTerm: 'Batman', joker: true })
        .then((response) => {
          expect(response).toEqual(filteredSearchResult);
          done();
        })
        .catch(done.fail);
      });
    });
  });

  describe('save()', () => {
    it('should post the document data to /entities', (done) => {
      const data = { name: 'document name' };
      entitiesAPI.save(data)
      .then((response) => {
        expect(JSON.parse(backend.lastOptions(`${APIURL}entities`).body)).toEqual(data);
        expect(response).toEqual({ backednResponse: 'test' });
        done();
      })
      .catch(done.fail);
    });
  });

  describe('multipleUpdate()', () => {
    it('should post the ids and metadata to /entities/multipleupdate', (done) => {
      const values = { metadata: { text: 'document text' } };
      const ids = ['1', '2'];
      entitiesAPI.multipleUpdate(ids, values)
      .then((response) => {
        expect(JSON.parse(backend.lastOptions(`${APIURL}entities/multipleupdate`).body)).toEqual({ ids, values });
        expect(response).toEqual({ backednResponse: 'test multiple' });
        done();
      })
      .catch(done.fail);
    });
  });

  describe('delete()', () => {
    it('should delete the document', (done) => {
      const document = { sharedId: 'id', test: 'test' };
      entitiesAPI.delete(document)
      .then((response) => {
        expect(response).toEqual({ backednResponse: 'testdelete' });
        done();
      })
      .catch(done.fail);
    });
  });

  describe('deleteMultiple()', () => {
    it('should delete all the entities', (done) => {
      const documents = [{ sharedId: 'id1' }, { sharedId: 'id2' }];
      entitiesAPI.deleteMultiple(documents)
      .then((response) => {
        expect(response).toEqual({ backednResponse: 'testdeleteMultiple' });
        done();
      })
      .catch(done.fail);
    });
  });
});
