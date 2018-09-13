import { File } from 'babel-core';
import superagent from 'superagent';
import thunk from 'redux-thunk';

import { APIURL } from 'app/config.js';
import { actions as basicActions } from 'app/BasicReducer';
import { mockID } from 'shared/uniqueID.js';
import * as actions from 'app/Uploads/actions/uploadsActions';
import backend from 'fetch-mock';
import configureMockStore from 'redux-mock-store';
import * as notificationsTypes from 'app/Notifications/actions/actionTypes';
import * as types from 'app/Uploads/actions/actionTypes';

import api from '../../../utils/api';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('uploadsActions', () => {
  beforeEach(() => {
    mockID();
    backend.restore();
    backend
    .post(`${APIURL}documents`, { body: JSON.stringify({ testBackendResult: 'ok' }) })
    .delete(`${APIURL}documents?name=doc&_id=abc1`, { body: JSON.stringify({ testBackendResult: 'ok' }) });
  });

  afterEach(() => backend.restore());

  describe('enterUploads()', () => {
    it('should return a ENTER_UPLOADS_SECTION', () => {
      const action = actions.enterUploads();
      expect(action).toEqual({ type: types.ENTER_UPLOADS_SECTION });
    });
  });

  describe('conversionComplete()', () => {
    it('should return a CONVERSION_COMPLETE with the document id', () => {
      const action = actions.conversionComplete('document_id');
      expect(action).toEqual({ type: types.CONVERSION_COMPLETE, doc: 'document_id' });
    });
  });

  describe('async actions', () => {
    describe('createDocument', () => {
      it('should create a document', (done) => {
        backend.restore();
        backend
        .post(`${APIURL}documents`, { body: JSON.stringify({ _id: 'test', sharedId: 'sharedId' }) });

        const newDoc = { name: 'doc' };
        const store = mockStore({});

        const expectedActions = [
          { type: types.NEW_UPLOAD_DOCUMENT, doc: 'sharedId' },
          { type: types.ELEMENT_CREATED, doc: { _id: 'test', sharedId: 'sharedId' } }
        ];

        store.dispatch(actions.createDocument(newDoc))
        .then((createdDoc) => {
          expect(createdDoc).toEqual({ _id: 'test', sharedId: 'sharedId' });
          expect(backend.lastOptions().body).toEqual(JSON.stringify({ name: 'doc' }));
          expect(store.getActions()).toEqual(expectedActions);
          done();
        })
        .catch(done.fail);
      });
    });

    describe('uploadDocument', () => {
      it('should create a document and upload file while dispatching the upload progress', () => {
        const mockUpload = superagent.post(`${APIURL}upload`);
        spyOn(mockUpload, 'field').and.returnValue(mockUpload);
        spyOn(mockUpload, 'attach').and.returnValue(mockUpload);
        spyOn(superagent, 'post').and.returnValue(mockUpload);

        const expectedActions = [
          { type: types.UPLOAD_PROGRESS, doc: 'abc1', progress: 55 },
          { type: types.UPLOAD_PROGRESS, doc: 'abc1', progress: 65 },
          { type: types.UPLOAD_COMPLETE, doc: 'abc1' }
        ];
        const store = mockStore({});

        // needed to work with firefox/chrome and phantomjs
        let file = { name: 'filename' };
        const isChrome = typeof File === 'function';
        if (isChrome) {
          file = new File([], 'filename');
        }
        //

        store.dispatch(actions.uploadDocument('abc1', file));
        expect(mockUpload.field).toHaveBeenCalledWith('document', 'abc1');
        expect(mockUpload.attach).toHaveBeenCalledWith('file', file, file.name);

        mockUpload.emit('progress', { percent: 55.1 });
        mockUpload.emit('progress', { percent: 65 });
        mockUpload.emit('response', { text: JSON.stringify({ test: 'test' }) });
        expect(store.getActions()).toEqual(expectedActions);
      });
    });

    describe('uploadCustom', () => {
      it('should upload a file and then add it to the customUploads', (done) => {
        const mockUpload = superagent.post(`${APIURL}customisation/upload`);
        spyOn(mockUpload, 'field').and.returnValue(mockUpload);
        spyOn(mockUpload, 'attach').and.returnValue(mockUpload);
        spyOn(superagent, 'post').and.returnValue(mockUpload);

        const expectedActions = [
          { type: types.UPLOAD_PROGRESS, doc: 'customUpload_unique_id', progress: 65 },
          { type: types.UPLOAD_PROGRESS, doc: 'customUpload_unique_id', progress: 75 },
          { type: types.UPLOAD_COMPLETE, doc: 'customUpload_unique_id' },
          basicActions.push('customUploads', { test: 'test' })
        ];
        const store = mockStore({});

        // needed to work with firefox/chrome and phantomjs
        let file = { name: 'filename' };
        const isChrome = typeof File === 'function';
        if (isChrome) {
          file = new File([], 'filename');
        }
        //

        store.dispatch(actions.uploadCustom(file))
        .then(() => {
          expect(mockUpload.attach).toHaveBeenCalledWith('file', file, file.name);
          expect(store.getActions()).toEqual(expectedActions);
          done();
        });

        mockUpload.emit('progress', { percent: 65.1 });
        mockUpload.emit('progress', { percent: 75 });
        mockUpload.emit('response', { text: JSON.stringify({ test: 'test' }) });
      });
    });

    describe('deleteCustomUpload', () => {
      it('should delete the upload and remove it locally on success', (done) => {
        spyOn(api, 'delete').and.returnValue(Promise.resolve({ json: { _id: 'deleted' } }));

        const expectedActions = [
          basicActions.remove('customUploads', { _id: 'deleted' })
        ];

        const store = mockStore({});

        store.dispatch(actions.deleteCustomUpload('id'))
        .then(() => {
          expect(store.getActions()).toEqual(expectedActions);
          done();
        });
      });
    });

    describe('publishDocument', () => {
      it('should save the document with published:true and dispatch notification on success', (done) => {
        const document = { name: 'doc', _id: 'abc1' };

        const expectedActions = [
          { type: notificationsTypes.NOTIFY, notification: { message: 'Document published', type: 'success', id: 'unique_id' } },
          { type: types.REMOVE_DOCUMENT, doc: document },
          { type: 'viewer/doc/SET', value: { testBackendResult: 'ok' } },
          { type: 'UNSELECT_ALL_DOCUMENTS' }
        ];
        const store = mockStore({});

        store.dispatch(actions.publishDocument(document))
        .then(() => {
          expect(backend.lastOptions().body).toEqual(JSON.stringify({ name: 'doc', _id: 'abc1', published: true }));
          expect(store.getActions()).toEqual(expectedActions);
        })
        .then(done)
        .catch(done.fail);
      });
    });
  });
});
