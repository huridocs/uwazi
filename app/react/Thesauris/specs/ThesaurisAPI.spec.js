import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import {APIURL} from 'app/config.js';
import backend from 'fetch-mock';

describe('ThesaurisAPI', () => {
  let arrayResponse = [{thesauris: 'array'}];
  let singleResponse = [{thesauris: 'single'}];

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL + 'thesauris', 'GET', {body: JSON.stringify({rows: arrayResponse})})
    .mock(APIURL + 'thesauris?_id=thesauriId', 'GET', {body: JSON.stringify({rows: singleResponse})})
    .mock(APIURL + 'thesauris', 'DELETE', {body: JSON.stringify({backednResponse: 'testdelete'})})
    .mock(APIURL + 'thesauris', 'POST', {body: JSON.stringify({backednResponse: 'test'})});
  });

  describe('get()', () => {
    it('should request thesauris', (done) => {
      thesaurisAPI.get()
      .then((response) => {
        expect(response).toEqual(arrayResponse);
        done();
      })
      .catch(done.fail);
    });

    describe('when passing an id', () => {
      it('should request for the thesauri', (done) => {
        thesaurisAPI.get('thesauriId')
        .then((response) => {
          expect(response).toEqual(singleResponse);
          done();
        })
        .catch(done.fail);
      });
    });
  });

  describe('save()', () => {
    it('should post the thesauri data to /thesauris', (done) => {
      let data = {name: 'thesauri name', properties: []};
      thesaurisAPI.save(data)
      .then((response) => {
        expect(JSON.parse(backend.lastOptions(APIURL + 'thesauris').body)).toEqual(data);
        expect(response).toEqual({backednResponse: 'test'});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('delete()', () => {
    it('should delete the thesauri', (done) => {
      let thesauri = {_id: 'id'};
      thesaurisAPI.delete(thesauri)
      .then((response) => {
        expect(JSON.parse(backend.lastOptions(APIURL + 'thesauris').body)).toEqual(thesauri);
        expect(response).toEqual({backednResponse: 'testdelete'});
        done();
      })
      .catch(done.fail);
    });
  });
});
