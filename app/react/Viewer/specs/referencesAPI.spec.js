import referencesAPI from 'app/Viewer/referencesAPI';
import {APIURL} from 'app/config.js';
import backend from 'fetch-mock';

describe('referencesAPI', () => {
  let arrayResponse = [{documents: 'array'}];

  beforeEach(() => {
    backend.restore();
    backend
    .get(APIURL + 'references/by_document/sourceDocument', {body: JSON.stringify(arrayResponse)})
    .get(APIURL + 'references/count_by_relationtype?relationtypeId=abc1', {body: '2'})
    .delete(APIURL + 'references?_id=id&_rev=rev', {body: JSON.stringify({backendResponse: 'testdelete'})})
    .post(APIURL + 'references', {body: JSON.stringify({backednResponse: 'test'})});
  });

  afterEach(() => backend.restore());

  describe('get()', () => {
    it('should request references', (done) => {
      referencesAPI.get('sourceDocument')
      .then((response) => {
        expect(response).toEqual(arrayResponse);
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
      let document = {_id: 'id', _rev: 'rev', omitProperty: 'omit'};
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
