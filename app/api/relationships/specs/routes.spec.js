import db from 'api/utils/testing_db';
import relationships from 'api/relationships/relationships';

import entities from 'api/entities';
import instrumentRoutes from '../../utils/instrumentRoutes';
import relationshipsRroutes from '../routes.js';

describe('relationships routes', () => {
  let routes;

  beforeEach(done => {
    routes = instrumentRoutes(relationshipsRroutes);
    spyOn(relationships, 'save').and.returnValue(Promise.resolve());
    spyOn(relationships, 'delete').and.returnValue(Promise.resolve());
    db.clearAllAndLoad({}).then(done);
  });

  afterAll(done => {
    db.disconnect().then(done);
  });

  describe('POST', () => {
    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/references')).toMatchSnapshot();
    });

    it('should save a reference', async () => {
      const req = { body: { name: 'created_reference' }, language: 'es' };

      await routes.post('/api/references', req);
      expect(relationships.save).toHaveBeenCalledWith(req.body, req.language);
    });
  });

  describe('POST bulk', () => {
    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/relationships/bulk')).toMatchSnapshot();
    });

    it('should save and delete the relationships', async () => {
      const req = {
        body: {
          save: [{ _id: 1 }, { _id: 2 }],
          delete: [{ _id: 3 }],
        },
        language: 'es',
      };

      spyOn(entities, 'updateMetdataFromRelationships').and.returnValue(Promise.resolve());

      await routes.post('/api/relationships/bulk', req);
      expect(relationships.save).toHaveBeenCalledWith({ _id: 1 }, req.language);
      expect(relationships.save).toHaveBeenCalledWith({ _id: 2 }, req.language);
      expect(relationships.delete).toHaveBeenCalledWith({ _id: 3 }, req.language);
    });
  });

  describe('DELETE', () => {
    it('should have a validation schema', () => {
      expect(routes.delete.validation('/api/references')).toMatchSnapshot();
    });
    it('should delete the reference', async () => {
      const req = { query: { _id: 'to_delete_id' }, language: 'en' };

      await routes.delete('/api/references', req);
      expect(relationships.delete).toHaveBeenCalledWith({ _id: req.query._id }, 'en');
    });
  });

  describe('GET by_document', () => {
    it('should return relationships.getByDocument', async () => {
      const req = { query: { sharedId: 'documentId' }, language: 'es', user: { role: 'admin' } };

      spyOn(relationships, 'getByDocument').and.returnValue(Promise.resolve('byDocument'));

      const response = await routes.get('/api/references/by_document/', req);
      expect(relationships.getByDocument).toHaveBeenCalledWith('documentId', 'es', true);
      expect(response).toBe('byDocument');
    });
  });

  describe('GET group_by_connection', () => {
    it('should return grouped refernces by connection', async () => {
      const req = { query: { sharedId: 'documentId' }, language: 'es', user: 'user' };

      spyOn(relationships, 'getGroupsByConnection').and.returnValue(
        Promise.resolve('groupedByConnection')
      );

      const response = await routes.get('/api/references/group_by_connection/', req);
      expect(relationships.getGroupsByConnection).toHaveBeenCalledWith('documentId', 'es', {
        excludeRefs: true,
        user: 'user',
      });
      expect(response).toBe('groupedByConnection');
    });
  });

  describe('GET search', () => {
    beforeEach(() => {
      spyOn(relationships, 'search').and.returnValue(Promise.resolve('search results'));
    });

    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/references/search/')).toMatchSnapshot();
    });

    it('should return entities from relationships search() passing the user', async () => {
      const req = {
        language: 'es',
        user: 'user',
        query: { searchTerm: 'Something', sharedId: 'documentId' },
      };

      const response = await routes.get('/api/references/search/', req);
      expect(relationships.search).toHaveBeenCalledWith(
        'documentId',
        { searchTerm: 'Something', filter: {} },
        'es',
        'user'
      );
      expect(response).toBe('search results');
    });
  });

  describe('/references/count_by_relationtype', () => {
    it('should return the number of relationships using a relationtype', async () => {
      spyOn(relationships, 'countByRelationType').and.returnValue(Promise.resolve(2));
      const req = { query: { relationtypeId: 'abc1' } };
      const result = await routes.get('/api/references/count_by_relationtype', req);
      expect(result).toBe(2);
      expect(relationships.countByRelationType).toHaveBeenCalledWith('abc1');
    });
  });
});
