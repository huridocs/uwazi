import relationtypesRoutes from 'api/relationtypes/routes.js';
import instrumentRoutes from 'api/utils/instrumentRoutes';
import relationtypes from 'api/relationtypes/relationtypes';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('relationtypes routes', () => {
  let routes;
  let mockRequest = new Promise((resolve) => resolve({relationtypes: 'response'}));

  beforeEach(() => {
    routes = instrumentRoutes(relationtypesRoutes);
  });

  describe('GET', () => {
    it('should ask relationtypes for all documents', (done) => {
      spyOn(relationtypes, 'get').and.returnValue(mockRequest);
      routes.get('/api/relationtypes', {query: {}})
      .then((response) => {
        expect(relationtypes.get).toHaveBeenCalled();
        expect(response).toEqual({rows: {relationtypes: 'response'}});
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when passing id', () => {
      it('should ask for the specific relationtype', (done) => {
        spyOn(relationtypes, 'getById').and.returnValue(mockRequest);
        routes.get('/api/relationtypes', {query: {_id: 'someId'}})
        .then((response) => {
          expect(relationtypes.getById).toHaveBeenCalledWith('someId');
          expect(response).toEqual({rows: [{relationtypes: 'response'}]});
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('DELETE', () => {
    it('should delete the relationtype', (done) => {
      spyOn(relationtypes, 'delete').and.returnValue(mockRequest);
      routes.delete('/api/relationtypes', {query: {_id: 'someId', _rev: 'latest'}})
      .then((response) => {
        expect(relationtypes.delete).toHaveBeenCalledWith('someId');
        expect(response).toEqual({relationtypes: 'response'});
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('POST', () => {
    it('should save the relationtype', (done) => {
      spyOn(relationtypes, 'save').and.returnValue(mockRequest);
      routes.post('/api/relationtypes', {body: {name: 'my new template'}})
      .then((response) => {
        expect(relationtypes.save).toHaveBeenCalledWith({name: 'my new template'});
        expect(response).toEqual({relationtypes: 'response'});
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
