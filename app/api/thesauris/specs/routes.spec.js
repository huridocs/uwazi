import thesaurisRoute from '../routes.js';
import database from '../../utils/database.js';
import fixtures from './fixtures.js';
import {db_url as dbUrl} from '../../config/database.js';
import request from '../../../shared/JSONRequest';
import instrumentRoutes from '../../utils/instrumentRoutes';
import thesauris from '../thesauris';
import translations from 'api/i18n/translations';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('thesauris routes', () => {
  let routes;

  beforeEach((done) => {
    routes = instrumentRoutes(thesaurisRoute);
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });

  describe('GET', () => {
    fit('should return all thesauris by default', (done) => {
      spyOn(thesauris, 'get').and.returnValue(Promise.resolve('response'));
      routes.get('/api/thesauris', {language: 'es'})
      .then((response) => {
        expect(thesauris.get).toHaveBeenCalledWith(undefined, 'es');
        expect(response).toEqual({rows: 'response'});
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when passing id', () => {
      fit('should get passing id', (done) => {
        spyOn(thesauris, 'get').and.returnValue(Promise.resolve('response'));
        let req = {query: {_id: 'id'}};

        routes.get('/api/thesauris', req)
        .then(() => {
          expect(thesauris.get).toHaveBeenCalledWith('id', undefined);
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('dictionaries', () => {
      fit('should return all dictionaries by default', (done) => {
        spyOn(thesauris, 'dictionaries').and.returnValue(Promise.resolve('response'));
        routes.get('/api/dictionaries')
        .then((response) => {
          expect(thesauris.dictionaries).toHaveBeenCalled();
          expect(response).toEqual({rows: 'response'});
          done();
        })
        .catch(catchErrors(done));
      });
      describe('when passing id', () => {
        fit('should get matching id', (done) => {
          spyOn(thesauris, 'dictionaries').and.returnValue(Promise.resolve('response'));
          routes.get('/api/dictionaries', {query: {_id: 'id'}})
          .then((response) => {
            expect(thesauris.dictionaries).toHaveBeenCalledWith({_id: 'id'});
            expect(response).toEqual({rows: 'response'});
            done();
          })
          .catch(catchErrors(done));
        });
      });
    });
  });

  describe('DELETE', () => {
    fit('should delete a thesauri', (done) => {
      spyOn(thesauris, 'delete').and.returnValue(Promise.resolve());
      let req = {query: {_id: 'abc', _rev: '123'}};
      return routes.delete('/api/thesauris', req)
      .then(() => {
        expect(thesauris.delete).toHaveBeenCalledWith('abc', '123');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('POST', () => {
    fit('should create a thesauri', (done) => {
      let req = {body: {name: 'Batman wish list', values: [{id: '1', label: 'Joker BFF'}]}};
      routes.post('/api/thesauris', req)
      .then((response) => {
        expect(response.values[0].id).toEqual('1');
        expect(response.values[0].label).toEqual('Joker BFF');
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
