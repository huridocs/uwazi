import referencesRroutes from '../routes.js';
import database from '../../utils/database.js';
import fixtures from './fixtures.js';
import instrumentRoutes from '../../utils/instrumentRoutes';
import references from 'api/references/references';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('references routes', () => {
  let routes;

  beforeEach(() => {
    routes = instrumentRoutes(referencesRroutes);
    spyOn(references, 'save').and.returnValue(Promise.resolve());
    spyOn(references, 'delete').and.returnValue(Promise.resolve());
  });

  describe('POST', () => {
    it('should save a reference', (done) => {
      let req = {body: {name: 'created_reference'}, language: 'es'};

      routes.post('/api/references', req)
      .then(() => {
        expect(references.save).toHaveBeenCalledWith(req.body, req.language);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('DELETE', () => {
    it('should delete the reference', (done) => {
      let req = {query: {_id: 'to_delete_id'}};

      routes.delete('/api/references', req)
      .then(() => {
        expect(references.delete).toHaveBeenCalledWith(req.query._id);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('GET by_document', () => {
    it('should return references.getByDocument', (done) => {
      let req = {params: {id: 'documentId'}, language: 'es'};

      spyOn(references, 'getByDocument').and.returnValue(Promise.resolve('byDocument'));

      routes.get('/api/references/by_document/:id', req)
      .then((response) => {
        expect(references.getByDocument).toHaveBeenCalledWith('documentId', 'es');
        expect(response).toBe('byDocument');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('GET group_by_connection', () => {
    it('should return grouped refernces by connection', (done) => {
      let req = {params: {id: 'documentId'}, language: 'es', user: 'user'};

      spyOn(references, 'getGroupsByConnection').and.returnValue(Promise.resolve('groupedByConnection'));

      routes.get('/api/references/group_by_connection/:id', req)
      .then((response) => {
        expect(references.getGroupsByConnection).toHaveBeenCalledWith('documentId', 'es', {excludeRefs: true, user: 'user'});
        expect(response).toBe('groupedByConnection');
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
