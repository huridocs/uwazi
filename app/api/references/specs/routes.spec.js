import referencesRroutes from '../routes.js';
import instrumentRoutes from '../../utils/instrumentRoutes';
import search from '../../search/search';
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

  describe('POST bulk', () => {
    it('should save and delete the relationships', (done) => {
      let req = {body: {
        save: [{_id: 1}, {_id: 2}],
        delete: [{_id: 3}]
      }, language: 'es'};

      routes.post('/api/relationships/bulk', req)
      .then(() => {
        expect(references.save).toHaveBeenCalledWith({_id: 1}, req.language);
        expect(references.save).toHaveBeenCalledWith({_id: 2}, req.language);
        expect(references.delete).toHaveBeenCalledWith({_id: 3}, req.language);
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
            {connectedDocument: 'id1'},
            {_id: 'r2', connectedDocument: 'id2', sourceType: 'other', template: '123', metadata: {numeric: 1}}
          ]}
        ]
      }, {
        key: 'k2',
        context: 'Context 2',
        connectionLabel: 'Connection Label 2',
        connectionType: 'Connection Type 2',
        templates: [
          {_id: 't2', refs: [
            {_id: 'r1', connectedDocument: 'id2', sourceType: 'metadata', template: '456', metadata: {numeric: 7}},
            {connectedDocument: 'id3'}
          ]}
        ]
      }];
    });

    it('should return references limited by the entity they belong to with connection data added', (done) => {
      spyOn(search, 'search').and.returnValue(Promise.resolve({rows: [{sharedId: 'id2'}]}));
      spyOn(references, 'getGroupsByConnection').and.returnValue(Promise.resolve(groupsResult));

      const req = {params: {id: 'documentId'}, language: 'es', user: 'user', query: {sort: 'sort'}};

      routes.get('/api/references/search/:id', req)
      .then((response) => {
        const expectedParsedConnection1 = {
          context: 'Context 1',
          label: 'Connection Label 1',
          type: 'Connection Type 1',
          _id: 'r2',
          sourceType: 'other',
          template: '123',
          metadata: {numeric: 1}
        };

        const expectedParsedConnection2 = {
          context: 'Context 2',
          label: 'Connection Label 2',
          type: 'Connection Type 2',
          _id: 'r1',
          sourceType: 'metadata',
          template: '456',
          metadata: {numeric: 7}
        };

        expect(references.getGroupsByConnection).toHaveBeenCalledWith('documentId', 'es', {excludeRefs: false, user: 'user'});
        expect(search.search).toHaveBeenCalledWith({sort: 'sort', ids: ['id1', 'id2', 'id2', 'id3'], includeUnpublished: true}, 'es');
        expect(response.rows[0].connections[0]).toEqual(expectedParsedConnection1);
        expect(response.rows[0].connections[1]).toEqual(expectedParsedConnection2);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should return references limited by the entity they belong to and selected filter', (done) => {
      spyOn(search, 'search').and.returnValue(Promise.resolve({rows: [{sharedId: 'id2'}]}));
      spyOn(references, 'getGroupsByConnection').and.returnValue(Promise.resolve(groupsResult));

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
              sourceType: 'metadata',
              template: '456',
              metadata: {numeric: 7}
            }
          ]}
        ]};

        expect(references.getGroupsByConnection).toHaveBeenCalledWith('documentId', 'es', {excludeRefs: false, user: 'user'});
        expect(search.search).toHaveBeenCalledWith({filter, ids: ['id2', 'id3'], includeUnpublished: true}, 'es');
        expect(response).toEqual(expectedResponse);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should return no results if grouped references is empty', (done) => {
      spyOn(search, 'search').and.returnValue(Promise.resolve({rows: []}));
      spyOn(references, 'getGroupsByConnection').and.returnValue(Promise.resolve([]));

      const req = {params: {id: 'documentId'}, language: 'es', user: 'user', query: {}};

      routes.get('/api/references/search/:id', req)
      .then((response) => {
        expect(references.getGroupsByConnection).toHaveBeenCalledWith('documentId', 'es', {excludeRefs: false, user: 'user'});
        expect(search.search).toHaveBeenCalledWith({ids: [ 'no_results' ], includeUnpublished: true}, 'es');
        expect(response).toEqual({rows: []});
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
