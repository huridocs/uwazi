import entitiesAPI from '../EntitiesAPI';
import {APIURL} from 'app/config.js';
import backend from 'fetch-mock';

describe('EntitiesAPI', () => {
  let arrayResponse = [{entities: 'array'}];
  let searchResponse = [{entities: 'search'}];
  let filteredSearchResult = [{entities: 'Alfred'}];
  let singleResponse = [{entities: 'single'}];
  let listResponse = [{entities: 'list'}];

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL + 'entities', 'GET', {body: JSON.stringify({rows: arrayResponse})})
    .mock(APIURL + 'entities/search', 'GET', {body: JSON.stringify(searchResponse)})
    .mock(APIURL + 'entities/list?keys=%5B%221%22%2C%222%22%5D', 'GET', {body: JSON.stringify({rows: listResponse})})
    .mock(APIURL + 'entities/uploads', 'GET', {body: JSON.stringify({rows: 'uploads'})})
    .mock(APIURL + 'entities/count_by_template?templateId=templateId', 'GET', {body: JSON.stringify(1)})
    .mock(APIURL + 'entities/match_title?searchTerm=term', 'GET', {body: JSON.stringify(searchResponse)})
    .mock(APIURL + 'entities/search?searchTerm=Batman&joker=true', 'GET', {body: JSON.stringify(filteredSearchResult)})
    .mock(APIURL + 'entities?_id=documentId', 'GET', {body: JSON.stringify({rows: singleResponse})})
    .mock(APIURL + 'entities?_id=id', 'DELETE', {body: JSON.stringify({backednResponse: 'testdelete'})})
    .mock(APIURL + 'entities', 'POST', {body: JSON.stringify({backednResponse: 'test'})});
  });

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
  });

  describe('list()', () => {
    it('should request entities list', (done) => {
      entitiesAPI.list(['1', '2'])
      .then((response) => {
        expect(response).toEqual(listResponse);
        done();
      })
      .catch(done.fail);
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
        entitiesAPI.search({searchTerm: 'Batman', joker: true})
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
      let data = {name: 'document name'};
      entitiesAPI.save(data)
      .then((response) => {
        expect(JSON.parse(backend.lastOptions(APIURL + 'entities').body)).toEqual(data);
        expect(response).toEqual({backednResponse: 'test'});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('delete()', () => {
    it('should delete the document', (done) => {
      let document = {_id: 'id'};
      entitiesAPI.delete(document)
      .then((response) => {
        expect(response).toEqual({backednResponse: 'testdelete'});
        done();
      })
      .catch(done.fail);
    });
  });
});
