"use strict";
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _config = require("../../../config.js");

var _referencesAPI = _interopRequireDefault(require("../../../Viewer/referencesAPI"));
var modalActions = _interopRequireWildcard(require("../../../Modals/actions/modalActions"));
var actions = _interopRequireWildcard(require("../relationTypesActions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable max-nested-callbacks */

describe('relationTypesActions', () => {
  describe('editRelationType', () => {
    it('should load the relationType in the form model', () => {
      const relationType = { name: 'Secret list of things', values: [] };
      expect(actions.editRelationType(relationType)).toMatchSnapshot();
    });
  });

  describe('async action', () => {
    let dispatch;

    beforeEach(() => {
      _fetchMock.default.restore();
      _fetchMock.default.
      delete(`${_config.APIURL}relationtypes?_id=relationTypeId`, { body: JSON.stringify({ testBackendResult: 'ok' }) });
      dispatch = jasmine.createSpy('dispatch');
    });

    afterEach(() => _fetchMock.default.restore());

    describe('deleteRelationType', () => {
      it('should delete the relationType and dispatch a relationTypes/REMOVE action with the relation type', done => {
        const relationType = { _id: 'relationTypeId' };
        actions.deleteRelationType(relationType)(dispatch).
        then(() => {
          expect(dispatch).toHaveBeenCalledWith({ type: 'relationTypes/REMOVE', value: relationType });
          done();
        });
      });
    });

    describe('checkRelationTypeCanBeDeleted', () => {
      let relationType;
      beforeEach(() => {
        spyOn(modalActions, 'showModal');
        relationType = { _id: 'abc1' };
      });

      describe('when there is references using the relation type', () => {
        it('should showModal CantDeleteRelationType', done => {
          spyOn(_referencesAPI.default, 'countByRelationType').and.returnValue(Promise.resolve(2));

          actions.checkRelationTypeCanBeDeleted(relationType)(dispatch).
          then(() => {
            expect('this promise to not be rejected').toBe(false);
            done();
          }).
          catch(() => {
            done();
          });
        });
      });

      describe('when there is not references using the relation type', () => {
        it('should return a rejected promise', done => {
          spyOn(_referencesAPI.default, 'countByRelationType').and.returnValue(Promise.resolve(0));

          actions.checkRelationTypeCanBeDeleted(relationType)(dispatch).
          then(() => {
            done();
          }).
          catch(() => {
            expect('this promise to be rejected').toBe(false);
            done();
          });
        });
      });
    });
  });
});