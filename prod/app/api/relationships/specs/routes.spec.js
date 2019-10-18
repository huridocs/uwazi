"use strict";var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _relationships = _interopRequireDefault(require("../relationships"));

var _entities = _interopRequireDefault(require("../../entities"));
var _instrumentRoutes = _interopRequireDefault(require("../../utils/instrumentRoutes"));
var _routes = _interopRequireDefault(require("../routes.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('relationships routes', () => {
  let routes;

  beforeEach(done => {
    routes = (0, _instrumentRoutes.default)(_routes.default);
    spyOn(_relationships.default, 'save').and.returnValue(Promise.resolve());
    spyOn(_relationships.default, 'delete').and.returnValue(Promise.resolve());
    _testing_db.default.clearAllAndLoad({}).then(done);
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  describe('POST', () => {
    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/references')).toMatchSnapshot();
    });

    it('should save a reference', async () => {
      const req = { body: { name: 'created_reference' }, language: 'es' };

      await routes.post('/api/references', req);
      expect(_relationships.default.save).toHaveBeenCalledWith(req.body, req.language);
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
          delete: [{ _id: 3 }] },

        language: 'es' };


      spyOn(_entities.default, 'updateMetdataFromRelationships').and.returnValue(Promise.resolve());

      await routes.post('/api/relationships/bulk', req);
      expect(_relationships.default.save).toHaveBeenCalledWith({ _id: 1 }, req.language);
      expect(_relationships.default.save).toHaveBeenCalledWith({ _id: 2 }, req.language);
      expect(_relationships.default.delete).toHaveBeenCalledWith({ _id: 3 }, req.language);
    });
  });

  describe('DELETE', () => {
    it('should have a validation schema', () => {
      expect(routes.delete.validation('/api/references')).toMatchSnapshot();
    });
    it('should delete the reference', async () => {
      const req = { query: { _id: 'to_delete_id' }, language: 'en' };

      await routes.delete('/api/references', req);
      expect(_relationships.default.delete).toHaveBeenCalledWith({ _id: req.query._id }, 'en');
    });
  });

  describe('GET by_document', () => {
    it('should return relationships.getByDocument', async () => {
      const req = { query: { sharedId: 'documentId' }, language: 'es', user: { role: 'admin' } };

      spyOn(_relationships.default, 'getByDocument').and.returnValue(Promise.resolve('byDocument'));

      const response = await routes.get('/api/references/by_document/', req);
      expect(_relationships.default.getByDocument).toHaveBeenCalledWith('documentId', 'es', true);
      expect(response).toBe('byDocument');
    });
  });

  describe('GET group_by_connection', () => {
    it('should return grouped refernces by connection', async () => {
      const req = { query: { sharedId: 'documentId' }, language: 'es', user: 'user' };

      spyOn(_relationships.default, 'getGroupsByConnection').and.returnValue(Promise.resolve('groupedByConnection'));

      const response = await routes.get('/api/references/group_by_connection/', req);
      expect(_relationships.default.getGroupsByConnection).toHaveBeenCalledWith('documentId', 'es', { excludeRefs: true, user: 'user' });
      expect(response).toBe('groupedByConnection');
    });
  });

  describe('GET search', () => {
    beforeEach(() => {
      spyOn(_relationships.default, 'search').and.returnValue(Promise.resolve('search results'));
    });

    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/references/search/')).toMatchSnapshot();
    });

    it('should return entities from relationships search() passing the user', async () => {
      const req = { language: 'es', user: 'user', query: { searchTerm: 'Something', sharedId: 'documentId' } };

      const response = await routes.get('/api/references/search/', req);
      expect(_relationships.default.search).toHaveBeenCalledWith('documentId', { searchTerm: 'Something', filter: {} }, 'es', 'user');
      expect(response).toBe('search results');
    });
  });

  describe('/references/count_by_relationtype', () => {
    it('should return the number of relationships using a relationtype', async () => {
      spyOn(_relationships.default, 'countByRelationType').and.returnValue(Promise.resolve(2));
      const req = { query: { relationtypeId: 'abc1' } };
      const result = await routes.get('/api/references/count_by_relationtype', req);
      expect(result).toBe(2);
      expect(_relationships.default.countByRelationType).toHaveBeenCalledWith('abc1');
    });
  });
});