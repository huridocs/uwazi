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
      routes.get('/api/thesauris')
      .then((response) => {
        let docs = response.rows;
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
        let req = {query: {_id: 'non_existent_id'}};

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
      let postResponse;

      routes.post('/api/thesauris', req)
      .then((response) => {
        postResponse = response;
        return request.get(dbUrl + '/_design/thesauris/_view/all');
      })
      .then((response) => {
        let newDoc = response.json.rows.find((thesauri) => {
          return thesauri.value.name === 'Batman wish list';
        });

        expect(newDoc.value.values).toEqual([{id: '1', label: 'Joker BFF'}]);
        expect(newDoc.value._rev).toBe(postResponse.rev);
        done();
      })
      .catch(done.fail);
    });

    it('should set a default value of [] to values property if its missing', (done) => {
      let req = {body: {name: 'Scarecrow nightmares'}};
      let postResponse;

      routes.post('/api/thesauris', req)
      .then((response) => {
        postResponse = response;
        return request.get(dbUrl + '/_design/thesauris/_view/all');
      })
      .then((response) => {
        let newDoc = response.json.rows.find((template) => {
          return template.value.name === 'Scarecrow nightmares';
        });

        expect(newDoc.value.name).toBe('Scarecrow nightmares');
        expect(newDoc.value.values).toEqual([]);
        expect(newDoc.value._rev).toBe(postResponse.rev);
        done();
      })
      .catch(done.fail);
    });

    it('should set a unique id for each value when missing', (done) => {
      let req = {body: {name: 'Enigma questions', values: [
        {id: '1', label: 'A fly without wings is a walk?'},
        {id: '3', label: 'Wait for a waiter makes you a waiter?'},
        {label: 'If you have one eye, you blink or wink?'},
        {id: '8', label: 'Is there another word for synonym?'},
        {label: 'If you shouldnt talk to strangers, how you make friends?'}
      ]}};
      let postResponse;

      routes.post('/api/thesauris', req)
      .then((response) => {
        postResponse = response;
        return request.get(dbUrl + '/_design/thesauris/_view/all');
      })
      .then((response) => {
        let newDoc = response.json.rows.find((template) => {
          return template.value.name === 'Enigma questions';
        });

        expect(newDoc.value.name).toBe('Enigma questions');
        expect(newDoc.value.values[2].id).toEqual('9');
        expect(newDoc.value.values[4].id).toEqual('10');
        expect(newDoc.value._rev).toBe(postResponse.rev);
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
