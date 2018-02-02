import referencesAPI from 'app/Viewer/referencesAPI';
import {APIURL} from 'app/config.js';
import backend from 'fetch-mock';

describe('referencesAPI', () => {
  let byDocumentResponse = [{documents: 'array'}];
  let groupByConnectionResponse = [{connections: 'array'}];
  let searchResponse = [{results: 'array'}];
  let searchSortedResponse = [{results: 'sorted array'}];

  beforeEach(() => {
    backend.restore();
    backend
    .get(APIURL + 'references/by_document/sourceDocument', {body: JSON.stringify(byDocumentResponse)})
    .get(APIURL + 'references/group_by_connection/sourceDocument', {body: JSON.stringify(groupByConnectionResponse)})
    .get(APIURL + 'references/search/sourceDocument', {body: JSON.stringify(searchResponse)})
    .get(APIURL + 'references/search/sourceDocument?sort=title', {body: JSON.stringify(searchSortedResponse)})
    .get(APIURL + 'references/count_by_relationtype?relationtypeId=abc1', {body: '2'})
    .delete(APIURL + 'references?_id=id', {body: JSON.stringify({backendResponse: 'testdelete'})})
    .post(APIURL + 'references', {body: JSON.stringify({backednResponse: 'test'})});
  });

  afterEach(() => backend.restore());

  describe('get()', () => {
    it('should request references', (done) => {
      referencesAPI.get('sourceDocument')
      .then((response) => {
        expect(response).toEqual(byDocumentResponse);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('getGroupedByConnection()', () => {
    it('should request grouped references', (done) => {
      referencesAPI.getGroupedByConnection('sourceDocument')
      .then((response) => {
        expect(response).toEqual(groupByConnectionResponse);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('search()', () => {
    it('should search references', (done) => {
      referencesAPI.search('sourceDocument')
      .then((response) => {
        expect(response).toEqual(searchResponse);
        done();
      })
      .catch(done.fail);
    });

    it('should search references with additional options', (done) => {
      referencesAPI.search('sourceDocument', {sort: 'title'})
      .then((response) => {
        expect(response).toEqual(searchSortedResponse);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('save()', () => {
    it('should post the document data to /references', (done) => {
      let data = {name: 'document name'};
      referencesAPI.save(data)
      .then((response) => {
        expect(JSON.parse(backend.lastOptions(APIURL + 'references').body)).toEqual(data);
        expect(response).toEqual({backednResponse: 'test'});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('delete()', () => {
    it('should delete the document', (done) => {
      let document = {_id: 'id', omitProperty: 'omit'};
      referencesAPI.delete(document)
      .then((response) => {
        expect(response).toEqual({backendResponse: 'testdelete'});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('countByRelationType()', () => {
    it('should request references', (done) => {
      referencesAPI.countByRelationType('abc1')
      .then((response) => {
        expect(response).toEqual(2);
        done();
      })
      .catch(done.fail);
    });
  });
});
