import configureMockStore from 'redux-mock-store';
import backend from 'fetch-mock';
import thunk from 'redux-thunk';
import { APIURL } from 'app/config.js';
import { mockID } from 'shared/uniqueID';
import * as actions from 'app/Thesauri/actions/thesauriActions';
import * as types from 'app/Thesauri/actions/actionTypes';
import * as notificationsTypes from 'app/Notifications/actions/actionTypes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('thesaurisActions', () => {
  beforeEach(() => {
    mockID();
    backend.restore();
    backend.post(`${APIURL}thesauris`, { body: JSON.stringify({ testBackendResult: 'ok' }) });
  });

  afterEach(() => backend.restore());

  describe('saveThesaurus', () => {
    it('should save the thesauri and dispatch a thesauriSaved action and a notify', done => {
      const expectedActions = [
        { type: types.THESAURI_SAVED },
        {
          type: notificationsTypes.NOTIFY,
          notification: { message: 'Thesaurus saved', type: 'success', id: 'unique_id' },
        },
        {
          type: 'rrf/change',
          model: 'thesauri.data',
          value: { testBackendResult: 'ok' },
          silent: false,
          multi: false,
          external: true,
        },
      ];
      const store = mockStore({});

      const data = { name: 'Secret list of things', values: [] };
      store
        .dispatch(actions.saveThesaurus(data))
        .then(() => {
          expect(store.getActions()).toEqual(expectedActions);
        })
        .then(done)
        .catch(done.fail);

      expect(JSON.parse(backend.lastOptions(`${APIURL}thesauris`).body)).toEqual(data);
    });
  });
});
