import referencesAPI from 'app/Viewer/referencesAPI';
import {APIURL} from 'app/config.js';
import backend from 'fetch-mock';

describe('referencesAPI', () => {
  let arrayResponse = [{documents: 'array'}];

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL + 'references?sourceDocument=sourceDocument', 'GET', {body: JSON.stringify({rows: arrayResponse})})
    .mock(APIURL + 'references', 'DELETE', {body: JSON.stringify({backednResponse: 'testdelete'})})
    .mock(APIURL + 'references', 'POST', {body: JSON.stringify({backednResponse: 'test'})});
  });

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
      let document = {_id: 'id'};
      referencesAPI.delete(document)
      .then((response) => {
        expect(JSON.parse(backend.lastOptions(APIURL + 'references').body)).toEqual(document);
        expect(response).toEqual({backednResponse: 'testdelete'});
        done();
      })
      .catch(done.fail);
    });
  });
});
