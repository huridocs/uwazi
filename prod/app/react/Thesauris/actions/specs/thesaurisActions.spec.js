"use strict";var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _config = require("../../../config.js");

var actions = _interopRequireWildcard(require("../thesaurisActions"));
var _reactReduxForm = require("react-redux-form");
var _ThesaurisAPI = _interopRequireDefault(require("../../ThesaurisAPI"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('thesaurisActions', () => {
  describe('editThesauri', () => {
    it('should set the thesauri in the form ', () => {
      const thesauri = { name: 'Secret list of things', values: [] };
      const dispatch = jasmine.createSpy('dispatch');
      spyOn(_reactReduxForm.actions, 'load');
      actions.editThesauri(thesauri)(dispatch);

      expect(_reactReduxForm.actions.load).toHaveBeenCalledWith('thesauri.data', thesauri);
    });
  });

  describe('async action', () => {
    let dispatch;

    beforeEach(() => {
      _fetchMock.default.restore();
      _fetchMock.default.
      delete(`${_config.APIURL}thesauris?_id=thesauriId`, { body: JSON.stringify({ testBackendResult: 'ok' }) }).
      get(`${_config.APIURL}templates/count_by_thesauri?_id=thesauriWithTemplates`, { body: JSON.stringify(2) }).
      get(`${_config.APIURL}templates/count_by_thesauri?_id=thesauriWithoutTemplates`, { body: JSON.stringify(0) });
      dispatch = jasmine.createSpy('dispatch');
    });

    afterEach(() => _fetchMock.default.restore());

    describe('deleteThesauri', () => {
      it('should delete the thesauri and dispatch a thesauris/REMOVE action with the thesauri', done => {
        const thesauri = { _id: 'thesauriId' };
        actions.deleteThesauri(thesauri)(dispatch).
        then(() => {
          expect(dispatch).toHaveBeenCalledWith({ type: 'dictionaries/REMOVE', value: thesauri });
          done();
        });
      });
    });

    describe('checkThesauriCanBeDeleted', () => {
      it('should return a promise if the thesauri is NOT been use', done => {
        const data = { _id: 'thesauriWithoutTemplates' };
        actions.checkThesauriCanBeDeleted(data)(dispatch).
        then(() => {
          done();
        }).
        catch(() => {
          expect('Promise not to be rejected').toBe(false);
          done();
        });
      });

      it('should reject a promise if the thesauri IS been use', done => {
        const data = { _id: 'thesauriWithTemplates' };
        actions.checkThesauriCanBeDeleted(data)(dispatch).
        then(() => {
          expect('Promise to be rejected').toBe(false);
          done();
        }).
        catch(() => {
          done();
        });
      });
    });

    describe('reloadThesauris', () => {
      it('should set thesauris to new values', done => {
        spyOn(_ThesaurisAPI.default, 'get').and.returnValue(Promise.resolve('thesaurisResponse'));
        actions.reloadThesauris()(dispatch).
        then(() => {
          expect(dispatch).toHaveBeenCalledWith({ type: 'thesauris/SET', value: 'thesaurisResponse' });
          done();
        });
      });
    });
  });
});