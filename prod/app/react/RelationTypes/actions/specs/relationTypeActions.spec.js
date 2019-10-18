"use strict";var _reduxMockStore = _interopRequireDefault(require("redux-mock-store"));
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _config = require("../../../config.js");
var _reduxThunk = _interopRequireDefault(require("redux-thunk"));
var _uniqueID = require("../../../../shared/uniqueID");

var actions = _interopRequireWildcard(require("../relationTypeActions"));
var types = _interopRequireWildcard(require("../actionTypes"));
var notificationsTypes = _interopRequireWildcard(require("../../../Notifications/actions/actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const middlewares = [_reduxThunk.default];
const mockStore = (0, _reduxMockStore.default)(middlewares);

describe('relationTypesActions', () => {
  beforeEach(() => {
    (0, _uniqueID.mockID)();
    _fetchMock.default.restore();
    _fetchMock.default.
    post(`${_config.APIURL}relationtypes`, { body: JSON.stringify({ testBackendResult: 'ok' }) });
  });

  afterEach(() => _fetchMock.default.restore());

  describe('saveRelationType', () => {
    it('should save the relationType and dispatch a relationTypeSaved action and a notify', done => {
      const relationType = { name: 'Secret list of things', values: [] };
      const expectedActions = [
      { type: types.RELATION_TYPE_SAVED },
      { type: notificationsTypes.NOTIFY, notification: { message: 'RelationType saved', type: 'success', id: 'unique_id' } }];

      const store = mockStore({});

      actions.saveRelationType(relationType)(store.dispatch).
      then(() => {
        expect(store.getActions()).toEqual(expectedActions);
      }).
      then(done).
      catch(done.fail);

      expect(JSON.parse(_fetchMock.default.lastOptions(`${_config.APIURL}relationtypes`).body)).toEqual(relationType);
    });
  });

  describe('resetRelationType', () => {
    it('should return a RESET_RELATION_TYPE action', () => {
      const action = actions.resetRelationType();
      expect(action).toEqual({ type: types.RESET_RELATION_TYPE });
    });
  });
});