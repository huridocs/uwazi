import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import backend from 'fetch-mock';
import superagent from 'superagent';

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
    describe('uploadDocument', () => {
      it('should create a document and upload file while dispatching the upload progress', (done) => {
        backend.restore();
        backend
        .mock(APIURL + 'documents', 'POST', {body: JSON.stringify({_id: 'test'})});

        let mockUpload = superagent.post(APIURL + 'upload');
        spyOn(mockUpload, 'field').and.callThrough();
        spyOn(mockUpload, 'attach').and.callThrough();
        spyOn(superagent, 'post').and.returnValue(mockUpload);

        let document = {name: 'doc'};

        const expectedActions = [
          {type: types.NEW_UPLOAD_DOCUMENT, doc: {_id: 'test'}},
          {type: types.UPLOAD_PROGRESS, doc: 'test', progress: 0},
          {type: types.UPLOAD_PROGRESS, doc: 'test', progress: 55},
          {type: types.UPLOAD_COMPLETE, doc: 'test'}
        ];
        const store = mockStore({});

        let file = {name: 'filename'};
        store.dispatch(actions.uploadDocument(document, file))
        .then(() => {
          expect(backend.lastOptions().body).toEqual(JSON.stringify({name: 'doc'}));
          expect(mockUpload.field).toHaveBeenCalledWith('document', 'test');
          expect(mockUpload.attach).toHaveBeenCalledWith('file', file, file.name);

          mockUpload.emit('progress', {percent: 55.1});
          mockUpload.emit('response');
          expect(store.getActions()).toEqual(expectedActions);
        })
        .then(done)
        .catch(done.fail);
      });
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
});
