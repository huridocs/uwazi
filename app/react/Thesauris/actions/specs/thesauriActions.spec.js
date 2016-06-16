import configureMockStore from 'redux-mock-store';
import backend from 'fetch-mock';
import {APIURL} from 'app/config.js';
import {mockID} from 'shared/uniqueID';
import thunk from 'redux-thunk';
const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

import * as actions from 'app/Thesauris/actions/thesauriActions';
import * as types from 'app/Thesauris/actions/actionTypes';
import * as notificationsTypes from 'app/Notifications/actions/actionTypes';

describe('thesaurisActions', () => {
  beforeEach(() => {
    mockID();
    backend.restore();
    backend
    .mock(APIURL + 'thesauris', 'post', {body: JSON.stringify({testBackendResult: 'ok'})});
  });

  describe('saveThesauri', () => {
    it('should save the thesauri and dispatch a thesauriSaved action and a notify', (done) => {
      let thesauri = {name: 'Secret list of things', values: []};
      const expectedActions = [
        {type: types.THESAURI_SAVED},
        {type: notificationsTypes.NOTIFY, notification: {message: 'Thesauri saved', type: 'success', id: 'unique_id'}}
      ];
      const store = mockStore({});

      store.dispatch(actions.saveThesauri(thesauri))
      .then(() => {
        expect(store.getActions()).toEqual(expectedActions);
      })
      .then(done)
      .catch(done.fail);

      expect(JSON.parse(backend.lastOptions(APIURL + 'thesauris').body)).toEqual(thesauri);
    });
  });
});
