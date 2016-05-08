import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import {APIURL} from 'app/config.js';
import backend from 'fetch-mock';

describe('RelationTypesAPI', () => {
  let arrayResponse = [{name: 'test'}, {name: 'test2'}];
  let singleResponse = {name: 'test'};

  beforeEach(() => {
    backend.restore();
    backend
    .mock(APIURL + 'relationtypes', 'GET', {body: JSON.stringify({rows: arrayResponse})})
    .mock(APIURL + 'relationtypes?_id=relationId', 'GET', {body: JSON.stringify({rows: [singleResponse]})})
    .mock(APIURL + 'relationtypes?_id=id', 'DELETE', {body: JSON.stringify({backednResponse: 'testdelete'})})
    .mock(APIURL + 'relationtypes', 'POST', {body: JSON.stringify({backednResponse: 'test'})});
  });

  describe('get()', () => {
    it('should request relationTypes', (done) => {
      relationTypesAPI.get()
      .then((response) => {
        expect(response).toEqual(arrayResponse);
        done();
      })
      .catch(done.fail);
    });

    describe('when passing an id', () => {
      it('should request for the thesauri', (done) => {
        relationTypesAPI.get('relationId')
        .then((response) => {
          expect(response[0]).toEqual(singleResponse);
          done();
        })
        .catch(done.fail);
      });
    });
  });

  describe('save()', () => {
    it('should post the thesauri data to /relationTypes', (done) => {
      let data = {name: 'thesauri name', properties: []};
      relationTypesAPI.save(data)
      .then((response) => {
        expect(JSON.parse(backend.lastOptions(APIURL + 'relationtypes').body)).toEqual(data);
        expect(response).toEqual({backednResponse: 'test'});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('delete()', () => {
    it('should delete the thesauri', (done) => {
      let thesauri = {_id: 'id'};
      relationTypesAPI.delete(thesauri)
      .then((response) => {
        expect(response).toEqual({backednResponse: 'testdelete'});
        done();
      })
      .catch(done.fail);
    });
  });
});
