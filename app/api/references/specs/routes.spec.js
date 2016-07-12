import referencesRroutes from '../routes.js';
import database from '../../utils/database.js';
import fixtures from './fixtures.js';
import {db_url as dbUrl} from '../../config/database.js';
import request from '../../../shared/JSONRequest';
import instrumentRoutes from '../../utils/instrumentRoutes';
import references from 'api/references/references';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('references routes', () => {
  let routes;

  beforeEach((done) => {
    routes = instrumentRoutes(referencesRroutes);
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(catchErrors(done));

    spyOn(references, 'save').and.returnValue(Promise.resolve());
    spyOn(references, 'delete').and.returnValue(Promise.resolve());
  });

  describe('POST', () => {
    it('should save a reference', (done) => {
      let req = {body: {name: 'created_reference'}};

      routes.post('/api/references', req)
      .then(() => {
        expect(references.save).toHaveBeenCalledWith(req.body);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('DELETE', () => {
    it('should delete the reference', (done) => {
      let req = {query: {name: 'created_reference'}};

      routes.delete('/api/references', req)
      .then(() => {
        expect(references.delete).toHaveBeenCalledWith(req.query);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('GET', () => {
    it('should return references by sourceDocument', (done) => {
      let req = {query: {sourceDocument: 'source1'}};

      routes.get('/api/references', req)
      .then((response) => {
        let docs = response.rows;
        expect(docs.length).toBe(2);
        expect(docs[0].title).toBe('reference1');
        expect(docs[1].title).toBe('reference3');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('/references/count_by_relationtype', () => {
    it('should return the number of references using a relationtype', (done) => {
      spyOn(references, 'countByRelationType').and.returnValue(Promise.resolve(2));
      let req = {query: {relationtypeId: 'abc1'}};
      routes.get('/api/references/count_by_relationtype', req)
      .then((result) => {
        expect(result).toBe(2);
        expect(references.countByRelationType).toHaveBeenCalledWith('abc1');
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
