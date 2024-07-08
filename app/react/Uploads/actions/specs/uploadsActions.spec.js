import superagent from 'superagent';
import thunk from 'redux-thunk';
import backend from 'fetch-mock';
import configureMockStore from 'redux-mock-store';
import { fromJS } from 'immutable';
import { APIURL } from 'app/config.js';
import { actions as basicActions } from 'app/BasicReducer';
import { actions as metadataActions } from 'app/Metadata';
import * as actions from 'app/Uploads/actions/uploadsActions';
import * as libraryTypes from 'app/Library/actions/actionTypes';
import * as types from 'app/Uploads/actions/actionTypes';
import entitiesApi from 'app/Entities/EntitiesAPI';
import { mockID } from 'shared/uniqueID.js';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const getMockFile = () => {
  let file = { name: 'filename' };
  const isChrome = typeof File === 'function';
  if (isChrome) {
    file = new File([], 'filename');
  }
  return file;
};

const emitProgressAndResponse = (superAgent, response) => {
  superAgent.emit('progress', { percent: 65.1 });
  superAgent.emit('progress', { percent: 75 });
  superAgent.emit('response', response);
};

const mockSuperAgent = (url = `${APIURL}import`) => {
  const mockUpload = superagent.post(url);
  spyOn(mockUpload, 'field').and.returnValue(mockUpload);
  spyOn(mockUpload, 'attach').and.returnValue(mockUpload);
  spyOn(superagent, 'post').and.returnValue(mockUpload);
  return mockUpload;
};

describe('uploadsActions', () => {
  beforeEach(() => {
    mockID();
    backend.restore();
    backend
      .post(`${APIURL}documents`, { body: JSON.stringify({ testBackendResult: 'ok' }) })
      .delete(`${APIURL}documents?name=doc&_id=abc1`, {
        body: JSON.stringify({ testBackendResult: 'ok' }),
      });
  });

  afterEach(() => backend.restore());

  describe('showImportPanel()', () => {
    it('should activate the flag in the state', () => {
      const dispatch = jasmine.createSpy('dispatch');
      actions.showImportPanel()(dispatch);
      expect(dispatch).toHaveBeenCalledWith({ type: 'showImportPanel/SET', value: true });
    });
  });

  describe('closeImportPanel()', () => {
    it('should deactivate the flag in the state', () => {
      const dispatch = jasmine.createSpy('dispatch');
      actions.closeImportPanel()(dispatch);
      expect(dispatch).toHaveBeenCalledWith({ type: 'showImportPanel/SET', value: false });
    });
  });

  describe('closeImportProgress()', () => {
    it('should deactivate the flag in the state', () => {
      const dispatch = jasmine.createSpy('dispatch');
      actions.closeImportProgress()(dispatch);
      expect(dispatch).toHaveBeenCalledWith({ type: 'importError/SET', value: {} });
      expect(dispatch).toHaveBeenCalledWith({ type: 'importProgress/SET', value: 0 });
      expect(dispatch).toHaveBeenCalledWith({ type: 'importEnd/SET', value: false });
      expect(dispatch).toHaveBeenCalledWith({ type: 'importStart/SET', value: false });
    });
  });

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
      it('should create a document', done => {
        backend.restore();
        backend.post(`${APIURL}documents`, {
          body: JSON.stringify({ _id: 'test', sharedId: 'sharedId' }),
        });

        const newDoc = { name: 'doc' };
        const store = mockStore({});

        const expectedActions = [
          { type: types.NEW_UPLOAD_DOCUMENT, doc: 'sharedId' },
          { type: types.ELEMENT_CREATED, doc: { _id: 'test', sharedId: 'sharedId' } },
        ];

        store
          .dispatch(actions.createDocument(newDoc))
          .then(createdDoc => {
            expect(createdDoc).toEqual({ _id: 'test', sharedId: 'sharedId' });
            expect(backend.lastOptions().body).toEqual(JSON.stringify({ name: 'doc' }));
            expect(store.getActions()).toEqual(expectedActions);
            done();
          })
          .catch(done.fail);
      });
    });

    describe('importData', () => {
      it('should upload a file and then import the data', done => {
        const mockUpload = mockSuperAgent();

        const expectedActions = [
          { type: 'importUploadProgress/SET', value: 65 },
          { type: 'importUploadProgress/SET', value: 75 },
          { type: 'importUploadProgress/SET', value: 0 },
        ];
        const store = mockStore({});
        const file = getMockFile();

        store.dispatch(actions.importData([file], '123')).then(() => {
          expect(mockUpload.attach).toHaveBeenCalledWith('file', file, file.name);
          expect(store.getActions()).toEqual(expectedActions);
          done();
        });

        emitProgressAndResponse(mockUpload, { text: JSON.stringify({ test: 'test' }), body: 'ok' });
      });
    });

    describe('publicSubmit', () => {
      let store;
      let file;
      let formData;

      beforeEach(() => {
        store = mockStore({});
        file = getMockFile();

        formData = {
          title: 'test',
          metadata: { prop: [{ value: 'value' }] },
          template: '123',
          captcha: { captcha: 'f0r71tw0', id: '42' },
          file,
          attachments: [file, file],
        };
      });

      it('should send the form data and upload the files', done => {
        const mockUpload = mockSuperAgent(`${APIURL}public`);
        store.dispatch(actions.publicSubmit(formData)).then(() => {
          delete formData.captcha;
          expect(mockUpload.field).toHaveBeenCalledWith(
            'entity',
            JSON.stringify({
              title: 'test',
              template: '123',
              metadata: { prop: [{ value: 'value' }] },
            })
          );
          expect(mockUpload.field).toHaveBeenCalledWith(
            'captcha',
            JSON.stringify({ captcha: 'f0r71tw0', id: '42' })
          );
          expect(mockUpload.attach).toHaveBeenCalledWith('file', file);
          expect(mockUpload.attach).toHaveBeenCalledWith('attachments[0]', file);
          expect(mockUpload.attach).toHaveBeenCalledWith('attachments[1]', file);
          expect(mockUpload.field).toHaveBeenCalledWith('attachments_originalname[0]', file.name);
          expect(mockUpload.field).toHaveBeenCalledWith('attachments_originalname[1]', file.name);
          expect(superagent.post).toHaveBeenCalledWith(`${APIURL}public`);
          done();
        });

        emitProgressAndResponse(mockUpload, {
          text: JSON.stringify({ test: 'test' }),
          body: 'ok',
          status: 200,
        });
      });

      it('should send data to remotepublic if remote is set to true', done => {
        const mockUpload = mockSuperAgent(`${APIURL}remotepublic`);

        store.dispatch(actions.publicSubmit(formData, true)).then(() => {
          expect(superagent.post).toHaveBeenCalledWith(`${APIURL}remotepublic`);
          done();
        });

        emitProgressAndResponse(mockUpload, {
          text: JSON.stringify({ test: 'test' }),
          body: 'ok',
          status: 200,
        });
      });

      it('should return promise that will be resolved after upload is complete', done => {
        const mockUpload = mockSuperAgent(`${APIURL}public`);
        jest.spyOn(store, 'dispatch');
        store.dispatch(actions.publicSubmit(formData)).then(progress => {
          progress.promise.then(res => {
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ ok: 1 });
            done();
          });
        });

        emitProgressAndResponse(mockUpload, {
          text: JSON.stringify({ test: 'test' }),
          body: { ok: 1 },
          status: 200,
        });
      });

      it('should return promise that rejects if upload completes with error status code', done => {
        const mockUpload = mockSuperAgent(`${APIURL}public`);
        jest.spyOn(store, 'dispatch');
        store.dispatch(actions.publicSubmit(formData)).then(progress => {
          progress.promise.catch(res => {
            expect(res.status).toBe(403);
            expect(res.body).toEqual({ error: 'error' });
            done();
          });
        });

        emitProgressAndResponse(mockUpload, {
          text: JSON.stringify({ error: 'error' }),
          body: { error: 'error' },
          status: 403,
        });
      });
    });

    describe('uploadDocument', () => {
      it('should create a document and upload file while dispatching the upload progress', async () => {
        const mockUpload = mockSuperAgent();

        const expectedActions = [
          { type: types.UPLOAD_PROGRESS, doc: 'abc1', progress: 65 },
          { type: types.UPLOAD_PROGRESS, doc: 'abc1', progress: 75 },
          {
            type: types.UPLOAD_COMPLETE,
            doc: 'abc1',
            file: { filename: 'a', originalname: 'a', size: 1 },
          },
        ];
        const store = mockStore({});
        const file = getMockFile();

        store.dispatch(actions.uploadDocument('abc1', file));
        expect(mockUpload.field).toHaveBeenCalledWith('entity', 'abc1');
        expect(mockUpload.field).toHaveBeenCalledWith('originalname', file.name);
        expect(mockUpload.attach).toHaveBeenCalledWith('file', file);

        emitProgressAndResponse(mockUpload, {
          text: JSON.stringify({ test: 'test' }),
          body: { filename: 'a', originalname: 'a', size: 1 },
        });
        expect(store.getActions()).toEqual(expectedActions);
      });
    });
  });

  describe('newEntity', () => {
    const store = mockStore({ templates: fromJS({}) });
    jest
      .spyOn(metadataActions, 'loadInReduxForm')
      .mockImplementation(() => store.dispatch({ type: 'action' }));

    jest.spyOn(basicActions, 'set');

    beforeEach(() => {
      store.dispatch(actions.newEntity('library'));
    });

    it('should load the redux form', () => {
      expect(metadataActions.loadInReduxForm).toHaveBeenCalledWith(
        'library.sidepanel.metadata',
        { title: '', type: 'entity' },
        {}
      );
    });

    it('should select the metadata tab', () => {
      expect(basicActions.set).toHaveBeenCalledWith('library.sidepanel.tab', 'metadata');
    });

    it('should clear the entity relationships count', () => {
      expect(basicActions.set).toHaveBeenCalledWith('relationships/list/connectionsGroups', []);
    });
  });

  describe('documentProcessed', () => {
    it('should dispatch the actions to update the documents status across the store', async () => {
      const sharedId = 'abc1';
      const __reducerKey = 'library';
      const dispatch = jasmine.createSpy('dispatch');
      const file = getMockFile();
      const doc = { sharedId, documents: [file] };
      jest.spyOn(entitiesApi, 'get').mockResolvedValue([doc]);
      await actions.documentProcessed(sharedId, __reducerKey)(dispatch);
      const expectedActions = [
        {
          type: types.UPLOAD_PROGRESS,
          doc: sharedId,
          progress: 100,
        },
        {
          type: libraryTypes.UPDATE_DOCUMENT,
          doc,
          __reducerKey,
        },
        {
          type: libraryTypes.UNSELECT_ALL_DOCUMENTS,
          __reducerKey,
        },
        {
          type: libraryTypes.SELECT_DOCUMENT,
          doc,
          __reducerKey,
        },
        {
          type: types.UPLOADS_COMPLETE,
          doc: sharedId,
          files: doc.documents,
          __reducerKey: 'library',
        },
        { type: types.BATCH_UPLOAD_COMPLETE, doc: sharedId },
      ];
      expectedActions.forEach(action => {
        expect(dispatch).toHaveBeenCalledWith(action);
      });
    });
  });
});
