import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import backend from 'fetch-mock';

import {APIURL} from 'app/config.js';
import {mockID} from 'app/utils/uniqueID.js';
import * as actions from 'app/Uploads/actions/documentActions';
import * as notificationsTypes from 'app/Notifications/actions/actionTypes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('async actions', () => {
  beforeEach(() => {
    mockID();
    backend.restore();
    backend
    .mock(APIURL + 'documents', 'POST', {body: JSON.stringify({testBackendResult: 'ok'})});
  });

  describe('saveDocument', () => {
    it('should save the document and dispatch a notification on success', (done) => {
      let document = {name: 'doc'};

      const expectedActions = [
        {type: notificationsTypes.NOTIFY, notification: {message: 'saved successfully !', type: 'info', id: 'unique_id'}}
      ];
      const store = mockStore({});

      store.dispatch(actions.saveDocument(document))
      .then(() => {
        expect(backend.lastOptions().body).toEqual(JSON.stringify({name: 'doc'}));
        expect(store.getActions()).toEqual(expectedActions);
      })
      .then(done)
      .catch(done.fail);
    });
  });

  describe('moveToLibrary', () => {
    it('should save the document with published:true and dispatch notification on success', (done) => {
      let document = {name: 'doc'};

      const expectedActions = [
        {type: notificationsTypes.NOTIFY, notification: {message: 'moved successfully !', type: 'info', id: 'unique_id'}}
      ];
      const store = mockStore({});

      store.dispatch(actions.moveToLibrary(document))
      .then(() => {
        expect(backend.lastOptions().body).toEqual(JSON.stringify({name: 'doc', published: true}));
        expect(store.getActions()).toEqual(expectedActions);
      })
      .then(done)
      .catch(done.fail);
    });
  });
});
