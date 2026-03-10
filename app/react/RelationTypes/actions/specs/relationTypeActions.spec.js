import configureMockStore from 'redux-mock-store';
import backend from 'fetch-mock';
import { APIURL } from 'app/config.js';
import thunk from 'redux-thunk';
import { mockID } from 'shared/uniqueID';

import * as actions from 'app/RelationTypes/actions/relationTypeActions';
import * as types from 'app/RelationTypes/actions/actionTypes';
import * as notificationsTypes from 'app/Notifications/actions/actionTypes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('relationTypesActions', () => {
  beforeEach(() => {
    mockID();
    backend.restore();
    backend.post(`${APIURL}relationtypes`, { body: JSON.stringify({ testBackendResult: 'ok' }) });
  });

  afterEach(() => backend.restore());

  describe('saveRelationType', () => {
    it('should save the relationType and dispatch a relationTypeSaved action, update the store, and a notify', done => {
      const relationType = { name: 'Secret list of things', values: [] };
      const expectedActions = [
        { type: types.RELATION_TYPE_SAVED },
        {
          type: 'relationTypes/PUSH',
          value: {
            testBackendResult: 'ok',
          },
        },
        {
          type: notificationsTypes.NOTIFY,
          notification: { message: 'RelationType saved', type: 'success', id: 'unique_id' },
        },
      ];
      const store = mockStore({});

      actions
        .saveRelationType(relationType)(store.dispatch)
        .then(() => {
          expect(store.getActions()).toEqual(expectedActions);
        })
        .then(done)
        .catch(done.fail);

      expect(JSON.parse(backend.lastOptions(`${APIURL}relationtypes`).body)).toEqual(relationType);
    });
  });

  describe('resetRelationType', () => {
    it('should return a RESET_RELATION_TYPE action', () => {
      const action = actions.resetRelationType();
      expect(action).toEqual({ type: types.RESET_RELATION_TYPE });
    });
  });
});
