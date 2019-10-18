"use strict";var _reduxMockStore = _interopRequireDefault(require("redux-mock-store"));
var _reduxThunk = _interopRequireDefault(require("redux-thunk"));
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _immutable = _interopRequireDefault(require("immutable"));

var _uniqueID = require("../../../../shared/uniqueID.js");
var _config = require("../../../config.js");
var connectionsActions = _interopRequireWildcard(require("../../../Connections/actions/actions"));
var _Relationships = require("../../../Relationships");
var actions = _interopRequireWildcard(require("../referencesActions"));
var types = _interopRequireWildcard(require("../actionTypes"));
var notificationsTypes = _interopRequireWildcard(require("../../../Notifications/actions/actionTypes"));
var _referencesAPI = _interopRequireDefault(require("../../referencesAPI"));
var _Scroller = _interopRequireDefault(require("../../utils/Scroller"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const middlewares = [_reduxThunk.default];
const mockStore = (0, _reduxMockStore.default)(middlewares);

describe('Viewer referencesActions', () => {
  describe('setReferences()', () => {
    it('should return a SET_REFERENCES type action with the references', () => {
      const action = actions.setReferences('references');
      expect(action).toEqual({ type: types.SET_REFERENCES, references: 'references' });
    });
  });

  describe('async actions', () => {
    beforeEach(() => {
      (0, _uniqueID.mockID)();
      spyOn(_Scroller.default, 'to');
      _fetchMock.default.restore();
      _fetchMock.default.delete(`${_config.APIURL}references?_id=bcd`, { body: JSON.stringify({ _id: 'reference' }) });
      spyOn(_Relationships.actions, 'reloadRelationships').and.callFake(entityId => ({ type: 'reloadRelationships', entityId }));
    });

    afterEach(() => _fetchMock.default.restore());

    describe('loadReferences', () => {
      beforeEach(() => {
        spyOn(_referencesAPI.default, 'get').and.callFake(requestParams => Promise.resolve(`${requestParams.data.sharedId}References`));
      });

      it('should fetch document references and dispatch SET_REFERENCES with result', done => {
        const store = mockStore({});
        actions.loadReferences('document1')(store.dispatch).
        then(() => {
          expect(store.getActions()).toEqual([{ type: 'SET_REFERENCES', references: 'document1References' }]);
          done();
        });
      });
    });

    describe('addReference', () => {
      let getState;
      let store;
      let references;

      beforeEach(() => {
        store = mockStore({});
        getState = jasmine.createSpy('getState').and.returnValue({
          documentViewer: { referencedDocuments: _immutable.default.fromJS([{ _id: '1' }]) },
          relationships: { list: { sharedId: 'docId' } } });

        references = [[
        { _id: 'addedReference1', reference: 'reference', sourceRange: { text: 'Text' } },
        { _id: 'addedReference2', reference: 'reference' }]];

      });

      it('should add the reference and reload relationships', () => {
        let expectedActions = [
        { type: types.ADD_REFERENCE, reference: references[0][1] },
        { type: types.ADD_REFERENCE, reference: references[0][0] },
        { type: 'viewer/targetDoc/UNSET' },
        { type: 'viewer/targetDocHTML/UNSET' },
        { type: 'viewer/targetDocReferences/UNSET' },
        { type: 'reloadRelationships', entityId: 'docId' },
        { type: types.ACTIVE_REFERENCE, reference: 'addedReference1' },
        { type: 'GO_TO_ACTIVE', value: true },
        { type: types.OPEN_PANEL, panel: 'viewMetadataPanel' },
        { type: 'viewer.sidepanel.tab/SET', value: 'references' }];


        actions.addReference(references, {}, true)(store.dispatch, getState);
        expect(store.getActions()).toEqual(expectedActions);

        store.clearActions();

        expectedActions = [
        { type: types.ADD_REFERENCE, reference: references[0][1] },
        { type: types.ADD_REFERENCE, reference: references[0][0] },
        { type: 'viewer/targetDoc/UNSET' },
        { type: 'viewer/targetDocHTML/UNSET' },
        { type: 'viewer/targetDocReferences/UNSET' },
        { type: 'reloadRelationships', entityId: 'docId' },
        { type: types.ACTIVE_REFERENCE, reference: 'addedReference1' },
        { type: types.OPEN_PANEL, panel: 'viewMetadataPanel' },
        { type: 'viewer.sidepanel.tab/SET', value: 'references' }];


        actions.addReference(references, {}, false)(store.dispatch, getState);
        expect(store.getActions()).toEqual(expectedActions);
      });
    });

    describe('saveTargetRangedReference', () => {
      let store;
      const getState = {};
      let saveConnectionDispatch;
      let connection;
      let targetRange;
      let onCreate;

      beforeEach(() => {
        saveConnectionDispatch = jasmine.createSpy('saveConnectionDispatch').and.returnValue('returnValue');
        connectionsActions.saveConnection = jasmine.createSpy('saveConnection').and.returnValue(saveConnectionDispatch);
        store = mockStore({});
        connection = { sourceDocument: 'sourceId' };
        targetRange = { text: 'target text' };
        onCreate = () => {};
      });

      it('should unset the targetDocReferences', () => {
        const returnValue = actions.saveTargetRangedReference(connection, targetRange, onCreate)(store.dispatch, getState);
        expect(store.getActions()).toContainEqual({ type: 'viewer/targetDocReferences/UNSET' });
        expect(connectionsActions.saveConnection).
        toHaveBeenCalledWith({ sourceDocument: 'sourceId', targetRange: { text: 'target text' } }, onCreate);
        expect(saveConnectionDispatch).toHaveBeenCalledWith(store.dispatch, getState);
        expect(returnValue).toBe('returnValue');
      });

      it('should not act if targetRange empty', () => {
        targetRange.text = '';
        const returnValue = actions.saveTargetRangedReference(connection, targetRange, onCreate)(store.dispatch);
        expect(store.getActions().length).toBe(0);
        expect(returnValue).toBeUndefined();
      });
    });

    describe('deleteReference', () => {
      it('should delete the reference\'s associated relationship and reload relationships', done => {
        const reference = { _id: 'abc', associatedRelationship: { _id: 'bcd' } };

        const expectedActions = [
        { type: 'reloadRelationships', entityId: 'docId' },
        { type: types.REMOVE_REFERENCE, reference },
        { type: notificationsTypes.NOTIFY, notification: { message: 'Connection deleted', type: 'success', id: 'unique_id' } }];


        const store = mockStore({});
        const getState = jasmine.createSpy('getState').and.returnValue({
          documentViewer: { referencedDocuments: _immutable.default.fromJS([{ _id: '1' }]) },
          relationships: { list: { sharedId: 'docId' } } });


        actions.deleteReference(reference)(store.dispatch, getState).
        then(() => {
          expect(store.getActions()).toEqual(expectedActions);
        }).
        then(done).
        catch(done.fail);
      });
    });
  });
});