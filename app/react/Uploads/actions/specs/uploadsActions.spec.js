import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import backend from 'fetch-mock';

import {APIURL} from 'app/config.js';
import {mockID} from 'app/utils/uniqueID.js';
import * as actions from 'app/Uploads/actions/uploadsActions';
import * as notificationsTypes from 'app/Notifications/actions/actionTypes';
import * as types from 'app/Uploads/actions/actionTypes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('uploadsActions', () => {
  beforeEach(() => {
    mockID();
    backend.restore();
    backend
    .mock(APIURL + 'documents', 'POST', {body: JSON.stringify({testBackendResult: 'ok'})});
  });

  describe('setUploads()', () => {
    it('should return a SET_UPLOADS with the documents', () => {
      let action = actions.setUploads('documents');
      expect(action).toEqual({type: types.SET_UPLOADS, documents: 'documents'});
    });
  });

  describe('setTemplates()', () => {
    it('should return a SET_TEMPLATES_UPLOADS with the templates', () => {
      let action = actions.setTemplates('templates');
      expect(action).toEqual({type: types.SET_TEMPLATES_UPLOADS, templates: 'templates'});
    });
  });

  describe('setThesauris()', () => {
    it('should return a SET_THESAURIS_UPLOADS with the thesauris', () => {
      let action = actions.setThesauris('thesauris');
      expect(action).toEqual({type: types.SET_THESAURIS_UPLOADS, thesauris: 'thesauris'});
    });
  });

  describe('async actions', () => {
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
});
