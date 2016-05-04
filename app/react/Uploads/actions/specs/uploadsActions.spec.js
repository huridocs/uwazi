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
    .mock(APIURL + 'documents', 'POST', {body: JSON.stringify({testBackendResult: 'ok'})})
    .mock(APIURL + 'documents', 'DELETE', {body: JSON.stringify({testBackendResult: 'ok'})});
  });

  describe('finishEdit()', () => {
    it('should return a FINISH_UPLOADED_DOCUMENT_EDIT', () => {
      let action = actions.finishEdit();
      expect(action).toEqual({type: types.FINISH_UPLOADED_DOCUMENT_EDIT});
    });
  });

  describe('updateDocument()', () => {
    it('should return a UPDATE_DOCUMENT with the document', () => {
      let action = actions.updateDocument('document');
      expect(action).toEqual({type: types.UPDATE_DOCUMENT, doc: 'document'});
    });
  });

  describe('editDocument()', () => {
    it('should return a EDIT_UPLOADED_DOCUMENT with the document', () => {
      let action = actions.editDocument('document');
      expect(action).toEqual({type: types.EDIT_UPLOADED_DOCUMENT, doc: 'document'});
    });
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

  describe('conversionComplete()', () => {
    it('should return a CONVERSION_COMPLETE with the document id', () => {
      let action = actions.conversionComplete('document_id');
      expect(action).toEqual({type: types.CONVERSION_COMPLETE, doc: 'document_id'});
    });
  });

  describe('async actions', () => {
    describe('createDocument', () => {
      it('should create a document', (done) => {
        backend.restore();
        backend
        .mock(APIURL + 'documents', 'POST', {body: JSON.stringify({_id: 'test'})});

        let newDoc = {name: 'doc'};
        const store = mockStore({});

        const expectedActions = [
          {type: types.DOCUMENT_CREATED, doc: {_id: 'test'}}
        ];

        store.dispatch(actions.createDocument(newDoc))
        .then((createdDoc) => {
          expect(createdDoc).toEqual({_id: 'test'});
          expect(backend.lastOptions().body).toEqual(JSON.stringify({name: 'doc'}));
          expect(store.getActions()).toEqual(expectedActions);
          done();
        })
        .catch(done.fail);
      });
    });

    describe('uploadDocument', () => {
      it('should create a document and upload file while dispatching the upload progress', () => {
        let mockUpload = superagent.post(APIURL + 'upload');
        spyOn(mockUpload, 'field').and.callThrough();
        spyOn(mockUpload, 'attach').and.callThrough();
        spyOn(superagent, 'post').and.returnValue(mockUpload);

        const expectedActions = [
          {type: types.NEW_UPLOAD_DOCUMENT, doc: 'abc1'},
          {type: types.UPLOAD_PROGRESS, doc: 'abc1', progress: 55},
          {type: types.UPLOAD_PROGRESS, doc: 'abc1', progress: 65},
          {type: types.UPLOAD_COMPLETE, doc: 'abc1'}
        ];
        const store = mockStore({});

        let file = {name: 'filename'};
        store.dispatch(actions.uploadDocument('abc1', file));
        expect(mockUpload.field).toHaveBeenCalledWith('document', 'abc1');
        expect(mockUpload.attach).toHaveBeenCalledWith('file', file, file.name);

        mockUpload.emit('progress', {percent: 55.1});
        mockUpload.emit('progress', {percent: 65});
        mockUpload.emit('response');
        expect(store.getActions()).toEqual(expectedActions);
      });
    });

    describe('saveDocument', () => {
      it('should save the document and dispatch a notification on success', (done) => {
        let doc = {name: 'doc'};

        const expectedActions = [
          {type: notificationsTypes.NOTIFY, notification: {message: 'Document updated', type: 'success', id: 'unique_id'}},
          {type: types.UPDATE_DOCUMENT, doc},
          {type: types.FINISH_UPLOADED_DOCUMENT_EDIT}
        ];
        const store = mockStore({});

        store.dispatch(actions.saveDocument(doc))
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
        let document = {name: 'doc', _id: 'abc1'};

        const expectedActions = [
          {type: notificationsTypes.NOTIFY, notification: {message: 'Document published', type: 'success', id: 'unique_id'}},
          {type: types.MOVED_TO_LIBRARY, doc: 'abc1'}
        ];
        const store = mockStore({});

        store.dispatch(actions.moveToLibrary(document))
        .then(() => {
          expect(backend.lastOptions().body).toEqual(JSON.stringify({name: 'doc', _id: 'abc1', published: true}));
          expect(store.getActions()).toEqual(expectedActions);
        })
        .then(done)
        .catch(done.fail);
      });
    });

    describe('deleteDocument', () => {
      it('should delete the document and dispatch notification on success', (done) => {
        let document = {name: 'doc', _id: 'abc1'};

        const expectedActions = [
          {type: notificationsTypes.NOTIFY, notification: {message: 'Document deleted', type: 'success', id: 'unique_id'}},
          {type: types.DOCUMENT_DELETED, doc: 'abc1'}
        ];
        const store = mockStore({});

        store.dispatch(actions.deleteDocument(document))
        .then(() => {
          expect(backend.lastOptions().body).toEqual(JSON.stringify({name: 'doc', _id: 'abc1'}));
          expect(store.getActions()).toEqual(expectedActions);
        })
        .then(done)
        .catch(done.fail);
      });
    });
  });
});
