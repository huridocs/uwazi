"use strict";var _routes = _interopRequireDefault(require("../routes.js"));
var _instrumentRoutes = _interopRequireDefault(require("../../utils/instrumentRoutes"));
var _relationtypes = _interopRequireDefault(require("../relationtypes"));
var _jasmineHelpers = require("../../utils/jasmineHelpers");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('relationtypes routes', () => {
  let routes;
  const mockRequest = new Promise(resolve => resolve({ relationtypes: 'response' }));

  beforeEach(() => {
    routes = (0, _instrumentRoutes.default)(_routes.default);
  });

  describe('GET', () => {
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/relationtypes')).toMatchSnapshot();
    });

    it('should ask relationtypes for all documents', done => {
      spyOn(_relationtypes.default, 'get').and.returnValue(mockRequest);
      routes.get('/api/relationtypes', { query: {} }).
      then(response => {
        expect(_relationtypes.default.get).toHaveBeenCalled();
        expect(response).toEqual({ rows: { relationtypes: 'response' } });
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    describe('when passing id', () => {
      it('should ask for the specific relationtype', done => {
        spyOn(_relationtypes.default, 'getById').and.returnValue(mockRequest);
        routes.get('/api/relationtypes', { query: { _id: 'someId' } }).
        then(response => {
          expect(_relationtypes.default.getById).toHaveBeenCalledWith('someId');
          expect(response).toEqual({ rows: [{ relationtypes: 'response' }] });
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });
    });
  });

  describe('DELETE', () => {
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/relationtypes')).toMatchSnapshot();
    });

    it('should delete the relationtype', done => {
      spyOn(_relationtypes.default, 'delete').and.returnValue(mockRequest);
      routes.delete('/api/relationtypes', { query: { _id: 'someId', _rev: 'latest' } }).
      then(response => {
        expect(_relationtypes.default.delete).toHaveBeenCalledWith('someId');
        expect(response).toEqual({ relationtypes: 'response' });
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('POST', () => {
    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/relationtypes')).toMatchSnapshot();
    });

    it('should save the relationtype', done => {
      spyOn(_relationtypes.default, 'save').and.returnValue(mockRequest);
      routes.post('/api/relationtypes', { body: { name: 'my new template' } }).
      then(response => {
        expect(_relationtypes.default.save).toHaveBeenCalledWith({ name: 'my new template' });
        expect(response).toEqual({ relationtypes: 'response' });
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });
});