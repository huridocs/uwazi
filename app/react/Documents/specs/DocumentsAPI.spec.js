import { APIURL } from 'app/config.js';
import backend from 'fetch-mock';
import { RequestParams } from 'app/utils/RequestParams';
import documentsAPI from '../DocumentsAPI';

describe('DocumentsAPI', () => {
  const arrayResponse = [{ documents: 'array' }];
  const searchResponse = [{ documents: 'search' }];
  const filteredSearchResult = [{ documents: 'Alfred' }];
  const singleResponse = [{ documents: 'single' }];
  const listResponse = [{ documents: 'list' }];

  beforeEach(() => {
    backend.restore();
    backend
      .get(`${APIURL}entities?include=%5B%22permissions%22%5D`, {
        body: JSON.stringify({ rows: arrayResponse }),
      })
      .get(`${APIURL}entities?_id=documentId&include=%5B%22permissions%22%5D`, {
        body: JSON.stringify({ rows: singleResponse }),
      })
      .get(`${APIURL}documents/search`, { body: JSON.stringify(searchResponse) })
      .get(`${APIURL}documents/list?keys=%5B%221%22%2C%222%22%5D`, {
        body: JSON.stringify({ rows: listResponse }),
      })
      .get(`${APIURL}documents/uploads`, { body: JSON.stringify({ rows: 'uploads' }) })
      .get(`${APIURL}documents/count_by_template?templateId=templateId`, {
        body: JSON.stringify(1),
      })
      .get(`${APIURL}documents/search?searchTerm=Batman&joker=true`, {
        body: JSON.stringify(filteredSearchResult),
      })
      .delete(`${APIURL}documents?sharedId=shared`, {
        body: JSON.stringify({ backednResponse: 'testdelete' }),
      })
      .post(`${APIURL}documents`, { body: JSON.stringify({ backednResponse: 'test' }) });
  });

  afterEach(() => backend.restore());

  describe('uploads', () => {
    it('should request uploads', done => {
      documentsAPI
        .uploads()
        .then(response => {
          expect(response).toEqual('uploads');
          done();
        })
        .catch(done.fail);
    });
  });

  describe('get()', () => {
    it('should request documents', done => {
      documentsAPI
        .get()
        .then(response => {
          expect(response).toEqual(arrayResponse);
          done();
        })
        .catch(done.fail);
    });

    describe('when passing an id', () => {
      it('should request for the thesauri', done => {
        const requestParams = new RequestParams({ _id: 'documentId' });
        documentsAPI
          .get(requestParams)
          .then(response => {
            expect(response).toEqual(singleResponse);
            done();
          })
          .catch(done.fail);
      });
    });
  });

  describe('list()', () => {
    it('should request documents list', done => {
      const requestParams = new RequestParams({ keys: ['1', '2'] });
      documentsAPI
        .list(requestParams)
        .then(response => {
          expect(response).toEqual(listResponse);
          done();
        })
        .catch(done.fail);
    });
  });

  describe('countByTemplate()', () => {
    it('should count_by_template', done => {
      const requestParams = new RequestParams({ templateId: 'templateId' });
      documentsAPI
        .countByTemplate(requestParams)
        .then(response => {
          expect(response).toEqual(1);
          done();
        })
        .catch(done.fail);
    });
  });

  describe('search()', () => {
    it('should search documents', done => {
      documentsAPI
        .search()
        .then(response => {
          expect(response).toEqual(searchResponse);
          done();
        })
        .catch(done.fail);
    });

    describe('when passing filters', () => {
      it('should search for it', done => {
        const requestParams = new RequestParams({ searchTerm: 'Batman', joker: true });
        documentsAPI
          .search(requestParams)
          .then(response => {
            expect(response).toEqual(filteredSearchResult);
            done();
          })
          .catch(done.fail);
      });
    });
  });

  describe('save()', () => {
    it('should post the document data to /documents', done => {
      const doc = { name: 'document name' };
      const requestParams = new RequestParams(doc);
      documentsAPI
        .save(requestParams)
        .then(response => {
          expect(JSON.parse(backend.lastOptions(`${APIURL}documents`).body)).toEqual(doc);
          expect(response).toEqual({ backednResponse: 'test' });
          done();
        })
        .catch(done.fail);
    });
  });

  describe('delete()', () => {
    it('should delete the document', done => {
      const requestParams = new RequestParams({ sharedId: 'shared' });
      documentsAPI
        .delete(requestParams)
        .then(response => {
          expect(response).toEqual({ backednResponse: 'testdelete' });
          done();
        })
        .catch(done.fail);
    });
  });
});
