import documentsAPI from 'app/Library/DocumentsAPI';
import {APIURL} from 'app/config.js';
import backend from 'fetch-mock';

describe('DocumentsAPI', () => {
  let arrayResponse = [{documents: 'array'}];
  let singleResponse = [{documents: 'single'}];

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL + 'documents', 'GET', {body: JSON.stringify({rows: arrayResponse})})
    .mock(APIURL + 'documents?_id=documentId', 'GET', {body: JSON.stringify({rows: singleResponse})})
    .mock(APIURL + 'documents', 'DELETE', {body: JSON.stringify({backednResponse: 'testdelete'})})
    .mock(APIURL + 'documents', 'POST', {body: JSON.stringify({backednResponse: 'test'})});
  });

  describe('get()', () => {
    it('should request documents', (done) => {
      documentsAPI.get()
      .then((response) => {
        expect(response).toEqual(arrayResponse);
        done();
      })
      .catch(done.fail);
    });

    describe('when passing an id', () => {
      it('should request for the thesauri', (done) => {
        documentsAPI.get('documentId')
        .then((response) => {
          expect(response).toEqual(singleResponse);
          done();
        })
        .catch(done.fail);
      });
    });
  });

  describe('save()', () => {
    it('should post the document data to /documents', (done) => {
      let data = {name: 'document name'};
      documentsAPI.save(data)
      .then((response) => {
        expect(JSON.parse(backend.lastOptions(APIURL + 'documents').body)).toEqual(data);
        expect(response).toEqual({backednResponse: 'test'});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('delete()', () => {
    it('should delete the document', (done) => {
      let document = {_id: 'id'};
      documentsAPI.delete(document)
      .then((response) => {
        expect(JSON.parse(backend.lastOptions(APIURL + 'documents').body)).toEqual(document);
        expect(response).toEqual({backednResponse: 'testdelete'});
        done();
      })
      .catch(done.fail);
    });
  });
});
