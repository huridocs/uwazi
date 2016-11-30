import thesaurisRoute from '../routes.js';
import database from '../../utils/database.js';
import fixtures from './fixtures.js';
import {db_url as dbUrl} from '../../config/database.js';
import request from '../../../shared/JSONRequest';
import instrumentRoutes from '../../utils/instrumentRoutes';
import thesauris from '../thesauris';

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
    it('should return all thesauris by default', (done) => {
      spyOn(thesauris, 'get').and.callThrough();
      routes.get('/api/thesauris', {language: 'es'})
      .then((response) => {
        let docs = response.rows;
        expect(thesauris.get).toHaveBeenCalledWith(undefined, 'es');
        expect(docs[0].name).toBe('secret recipes');
        done();
      })
      .catch(done.fail);
    });

    describe('when passing id', () => {
      it('should return matching thesauri', (done) => {
        let req = {query: {_id: 'c08ef2532f0bd008ac5174b45e033c94'}};

        routes.get('/api/thesauris', req)
        .then((response) => {
          let docs = response.rows;
          expect(docs[0].name).toBe('Top 2 scify books');
          done();
        })
        .catch(done.fail);
      });
    });

    describe('when there is a db error', () => {
      it('return the error in the response', (done) => {
        let req = {query: {_id: 'non_existent_id'}, language: 'es'};

        database.reset_testing_database()
        .then(() => routes.get('/api/thesauris', req))
        .then((response) => {
          let error = response.error;
          expect(error.error).toBe('not_found');
          done();
        })
        .catch(done.fail);
      });
    });
  });

  describe('DELETE', () => {
    it('should delete a thesauri', (done) => {
      spyOn(thesauris, 'delete').and.returnValue(Promise.resolve());
      let req = {query: {_id: 'abc', _rev: '123'}};
      return routes.delete('/api/thesauris', req)
      .then(() => {
        expect(thesauris.delete).toHaveBeenCalledWith('abc', '123');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('POST', () => {
    it('should create a thesauri', (done) => {
      let req = {body: {name: 'Batman wish list', values: [{id: '1', label: 'Joker BFF'}]}};

      routes.post('/api/thesauris', req)
      .then((response) => {
        expect(response.values).toEqual([{id: '1', label: 'Joker BFF'}]);
        expect(response._rev).toBeDefined();
        done();
      })
      .catch(done.fail);
    });

    it('should set a default value of [] to values property if its missing', (done) => {
      let req = {body: {name: 'Scarecrow nightmares'}};

      routes.post('/api/thesauris', req)
      .then((response) => {
        expect(response.name).toBe('Scarecrow nightmares');
        expect(response.values).toEqual([]);
        done();
      })
      .catch(done.fail);
    });

    describe('when passing _id and _rev', () => {
      it('edit an existing one', (done) => {
        request.get(dbUrl + '/c08ef2532f0bd008ac5174b45e033c94')
        .then((response) => {
          let template = response.json;
          let req = {body: {_id: template._id, _rev: template._rev, name: 'changed name'}};
          return routes.post('/api/thesauris', req);
        })
        .then(() => {
          return request.get(dbUrl + '/c08ef2532f0bd008ac5174b45e033c94');
        })
        .then((response) => {
          let template = response.json;
          expect(template.name).toBe('changed name');
          done();
        })
        .catch(done.fail);
      });
    });

    describe('when there is a db error', () => {
      it('return the error in the response', (done) => {
        let req = {body: {_id: 'c08ef2532f0bd008ac5174b45e033c93', _rev: 'bad_rev', name: ''}};

        routes.post('/api/thesauris', req)
        .then((response) => {
          let error = response.error;
          expect(error.error).toBe('bad_request');
          done();
        })
        .catch(done.fail);
      });
    });
  });
});
