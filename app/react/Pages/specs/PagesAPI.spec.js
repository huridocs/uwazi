import pagesAPI from '../PagesAPI';
import {APIURL} from 'app/config.js';
import backend from 'fetch-mock';

describe('pagesAPI', () => {
  let singleResponse = [{pages: 'single'}];
  let listResponse = [{pages: 'list'}];

  beforeEach(() => {
    backend.restore();
    backend
    .get(APIURL + 'pages?sharedId=documentId', {body: JSON.stringify(singleResponse)})
    .get(APIURL + 'pages/list', {body: JSON.stringify({rows: listResponse})})
    .post(APIURL + 'pages', {body: JSON.stringify({backednResponse: 'post'})})
    .delete(APIURL + 'pages?sharedId=id', {body: JSON.stringify({backednResponse: 'delete'})});
  });

  afterEach(() => backend.restore());

  describe('get()', () => {
    it('should request for the page', (done) => {
      pagesAPI.get('documentId')
      .then((response) => {
        expect(response).toEqual(singleResponse);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('list()', () => {
    it('should request pages list', (done) => {
      pagesAPI.list()
      .then((response) => {
        expect(response).toEqual(listResponse);
        done();
      })
      .catch(done.fail);
    });
  });


  describe('save()', () => {
    it('should post the document data to /pages', (done) => {
      let data = {title: 'document name'};
      pagesAPI.save(data)
      .then((response) => {
        expect(JSON.parse(backend.lastOptions(APIURL + 'pages').body)).toEqual(data);
        expect(response).toEqual({backednResponse: 'post'});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('delete()', () => {
    it('should delete the document', (done) => {
      let document = {sharedId: 'id'};
      pagesAPI.delete(document)
      .then((response) => {
        expect(response).toEqual({backednResponse: 'delete'});
        done();
      })
      .catch(done.fail);
    });
  });
});
