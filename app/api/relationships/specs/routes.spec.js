import relationshipsRroutes from '../routes.js';
import instrumentRoutes from '../../utils/instrumentRoutes';
import search from '../../search/search';
import relationships from 'api/relationships/relationships';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('relationships routes', () => {
  let routes;

  beforeEach(() => {
    routes = instrumentRoutes(relationshipsRroutes);
    spyOn(relationships, 'save').and.returnValue(Promise.resolve());
    spyOn(relationships, 'delete').and.returnValue(Promise.resolve());
  });

  describe('POST', () => {
    it('should save a reference', (done) => {
      let req = {body: {name: 'created_reference'}, language: 'es'};

      routes.post('/api/references', req)
      .then(() => {
        expect(relationships.save).toHaveBeenCalledWith(req.body, req.language);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('POST bulk', () => {
    it('should save and delete the relationships', (done) => {
      let req = {body: {
        save: [{_id: 1}, {_id: 2}],
        delete: [{_id: 3}]
      }, language: 'es'};

      routes.post('/api/relationships/bulk', req)
      .then(() => {
        expect(relationships.save).toHaveBeenCalledWith({_id: 1}, req.language);
        expect(relationships.save).toHaveBeenCalledWith({_id: 2}, req.language);
        expect(relationships.delete).toHaveBeenCalledWith({_id: 3}, req.language);
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
        expect(relationships.delete).toHaveBeenCalledWith(req.query._id);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('GET by_document', () => {
    it('should return relationships.getByDocument', (done) => {
      let req = {params: {id: 'documentId'}, language: 'es'};

      spyOn(relationships, 'getByDocument').and.returnValue(Promise.resolve('byDocument'));

      routes.get('/api/references/by_document/:id', req)
      .then((response) => {
        expect(relationships.getByDocument).toHaveBeenCalledWith('documentId', 'es');
        expect(response).toBe('byDocument');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('GET group_by_connection', () => {
    it('should return grouped refernces by connection', (done) => {
      let req = {params: {id: 'documentId'}, language: 'es', user: 'user'};

      spyOn(relationships, 'getGroupsByConnection').and.returnValue(Promise.resolve('groupedByConnection'));

      routes.get('/api/references/group_by_connection/:id', req)
      .then((response) => {
        expect(relationships.getGroupsByConnection).toHaveBeenCalledWith('documentId', 'es', {excludeRefs: true, user: 'user'});
        expect(response).toBe('groupedByConnection');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('GET search', () => {
    let groupsResult;

    beforeEach(() => {
      groupsResult = [{
        key: 'k1',
        context: 'Context 1',
        connectionLabel: 'Connection Label 1',
        connectionType: 'Connection Type 1',
        templates: [
          {_id: 't1', refs: [
            {entityData: {sharedId: 'id1'}, hub: 2},
            {_id: 'r2', entityData: {sharedId: 'id2'}, template: '123', metadata: {numeric: 1}, hub: 1}
          ]}
        ]
      }, {
        key: 'k2',
        context: 'Context 2',
        connectionLabel: 'Connection Label 2',
        connectionType: 'Connection Type 2',
        templates: [
          {_id: 't2', refs: [
            {_id: 'r1', entityData: {sharedId: 'id2'}, template: '456', metadata: {numeric: 7}, hub: 1},
            {entityData: {sharedId: 'id3'}, hub: 2}
          ]}
        ]
      }];
    });

    it('should return relationships limited by the entity they belong to with connection data added', (done) => {
      spyOn(search, 'search').and.returnValue(Promise.resolve({rows: [{sharedId: 'id2'}]}));
      spyOn(relationships, 'getGroupsByConnection').and.returnValue(Promise.resolve(groupsResult));

      const req = {params: {id: 'documentId'}, language: 'es', user: 'user', query: {sort: 'sort', limit: 9999}};

      routes.get('/api/references/search/:id', req)
      .then((response) => {
        const expectedParsedConnection1 = {
          context: 'Context 1',
          label: 'Connection Label 1',
          type: 'Connection Type 1',
          _id: 'r2',
          template: '123',
          metadata: {numeric: 1},
          hub: 1
        };

        const expectedParsedConnection2 = {
          context: 'Context 2',
          label: 'Connection Label 2',
          type: 'Connection Type 2',
          _id: 'r1',
          template: '456',
          metadata: {numeric: 7},
          hub: 1
        };

        expect(relationships.getGroupsByConnection).toHaveBeenCalledWith('documentId', 'es', {excludeRefs: false, user: 'user'});
        expect(search.search).toHaveBeenCalledWith({sort: 'sort', ids: ['id1', 'id2', 'id2', 'id3'], includeUnpublished: true, limit: 9999}, 'es');
        expect(response.rows[0].connections[0]).toEqual(expectedParsedConnection1);
        expect(response.rows[0].connections[1]).toEqual(expectedParsedConnection2);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should return relationships limited by the entity they belong to and selected filter', (done) => {
      spyOn(search, 'search').and.returnValue(Promise.resolve({rows: [{sharedId: 'id2'}]}));
      spyOn(relationships, 'getGroupsByConnection').and.returnValue(Promise.resolve(groupsResult));

      const filter = '{"k1": [], "k2": ["k2t2"]}';
      const req = {params: {id: 'documentId'}, language: 'es', user: 'user', query: {filter}};

      routes.get('/api/references/search/:id', req)
      .then((response) => {
        const expectedResponse = {rows: [
          {sharedId: 'id2', connections: [
            {
              context: 'Context 2',
              label: 'Connection Label 2',
              type: 'Connection Type 2',
              _id: 'r1',
              template: '456',
              metadata: {numeric: 7},
              hub: 1
            }
          ]}
        ]};

        expect(relationships.getGroupsByConnection).toHaveBeenCalledWith('documentId', 'es', {excludeRefs: false, user: 'user'});
        expect(search.search).toHaveBeenCalledWith({filter, ids: ['id2', 'id3'], includeUnpublished: true, limit: 9999}, 'es');
        expect(response).toEqual(expectedResponse);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should return no results if grouped relationships is empty', (done) => {
      spyOn(search, 'search').and.returnValue(Promise.resolve({rows: []}));
      spyOn(relationships, 'getGroupsByConnection').and.returnValue(Promise.resolve([]));

      const req = {params: {id: 'documentId'}, language: 'es', user: 'user', query: {}};

      routes.get('/api/references/search/:id', req)
      .then((response) => {
        expect(relationships.getGroupsByConnection).toHaveBeenCalledWith('documentId', 'es', {excludeRefs: false, user: 'user'});
        expect(search.search).toHaveBeenCalledWith({ids: [ 'no_results' ], includeUnpublished: true, limit: 9999}, 'es');
        expect(response).toEqual({rows: []});
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('/references/count_by_relationtype', () => {
    it('should return the number of relationships using a relationtype', (done) => {
      spyOn(relationships, 'countByRelationType').and.returnValue(Promise.resolve(2));
      let req = {query: {relationtypeId: 'abc1'}};
      routes.get('/api/references/count_by_relationtype', req)
      .then((result) => {
        expect(result).toBe(2);
        expect(relationships.countByRelationType).toHaveBeenCalledWith('abc1');
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
