"use strict";var _jasmineHelpers = require("../../utils/jasmineHelpers");
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _translations = _interopRequireDefault(require("../../i18n/translations"));

var _fixtures = _interopRequireDefault(require("./fixtures.js"));
var _instrumentRoutes = _interopRequireDefault(require("../../utils/instrumentRoutes"));
var _thesauris = _interopRequireDefault(require("../thesauris"));
var _routes = _interopRequireDefault(require("../routes.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('thesauris routes', () => {
  let routes;

  beforeEach(done => {
    routes = (0, _instrumentRoutes.default)(_routes.default);
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  describe('GET', () => {
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/thesauris')).toMatchSnapshot();
    });

    it('should return all thesauris by default, passing user', done => {
      spyOn(_thesauris.default, 'get').and.returnValue(Promise.resolve('response'));
      routes.get('/api/thesauris', { language: 'es', user: 'user' }).
      then(response => {
        let undefinedVar;
        expect(_thesauris.default.get).toHaveBeenCalledWith(undefinedVar, 'es', 'user');
        expect(response).toEqual({ rows: 'response' });
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    describe('when passing id', () => {
      it('should get passing id', done => {
        spyOn(_thesauris.default, 'get').and.returnValue(Promise.resolve('response'));
        const req = { query: { _id: 'id' } };

        routes.get('/api/thesauris', req).
        then(() => {
          let undefinedVar;
          expect(_thesauris.default.get).toHaveBeenCalledWith('id', undefinedVar, undefinedVar);
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });
    });

    describe('dictionaries', () => {
      it('should have a validation schema', () => {
        expect(routes.get.validation('/api/dictionaries')).toMatchSnapshot();
      });

      it('should return all dictionaries by default', done => {
        spyOn(_thesauris.default, 'dictionaries').and.returnValue(Promise.resolve('response'));
        routes.get('/api/dictionaries').
        then(response => {
          expect(_thesauris.default.dictionaries).toHaveBeenCalled();
          expect(response).toEqual({ rows: 'response' });
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });
      describe('when passing id', () => {
        it('should get matching id', done => {
          spyOn(_thesauris.default, 'dictionaries').and.returnValue(Promise.resolve('response'));
          routes.get('/api/dictionaries', { query: { _id: 'id' } }).
          then(response => {
            expect(_thesauris.default.dictionaries).toHaveBeenCalledWith({ _id: 'id' });
            expect(response).toEqual({ rows: 'response' });
            done();
          }).
          catch((0, _jasmineHelpers.catchErrors)(done));
        });
      });
    });
  });

  describe('DELETE', () => {
    it('should have a validation schema', () => {
      expect(routes.delete.validation('/api/thesauris')).toMatchSnapshot();
    });

    it('should delete a thesauri', done => {
      spyOn(_thesauris.default, 'delete').and.returnValue(Promise.resolve());
      const req = { query: { _id: 'abc', _rev: '123' } };
      return routes.delete('/api/thesauris', req).
      then(() => {
        expect(_thesauris.default.delete).toHaveBeenCalledWith('abc', '123');
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('POST', () => {
    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/thesauris')).toMatchSnapshot();
    });

    it('should create a thesauri', done => {
      spyOn(_translations.default, 'addContext').and.returnValue(Promise.resolve());
      const req = { body: { name: 'Batman wish list', values: [{ id: '1', label: 'Joker BFF' }] } };
      routes.post('/api/thesauris', req).
      then(response => {
        expect(response.values[0].id).toEqual('1');
        expect(response.values[0].label).toEqual('Joker BFF');
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    describe('when file is uploaded', () => {
      let file;
      let req;
      let args;
      beforeEach(() => {
        args = {
          name: 'Imported',
          values: [{ label: 'one' }] };

        file = {
          fieldname: 'file',
          originalname: 'import_thesauri.csv',
          encoding: 'utf8',
          mimetype: 'text/csv',
          destination: `${__dirname}/uploads/`,
          filename: 'import_thesauri.csv',
          path: `${__dirname}/uploads/import_thesauri.csv`,
          size: 112 };

        req = {
          language: 'es',
          user: 'admin',
          headers: {},
          body: { thesauri: JSON.stringify(args) },
          files: [file] };

      });
      it('should import data into the thesauri', async () => {
        jest.spyOn(_thesauris.default, 'save');
        const response = await routes.post('/api/thesauris', req);
        const thes = await _thesauris.default.getById(response._id);
        expect(thes.values.length).toBe(3);
        expect(thes.values.some(v => v.label === 'one')).toBe(true);
        expect(thes.values.some(v => v.label === 'Value 1')).toBe(true);
        expect(thes.values.some(v => v.label === 'Value 2')).toBe(true);
        expect(_thesauris.default.save).toHaveBeenCalledWith(args);
      });
    });
  });
});