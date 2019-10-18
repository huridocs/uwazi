"use strict";var _superagent = _interopRequireDefault(require("superagent"));
var _reduxThunk = _interopRequireDefault(require("redux-thunk"));


var _config = require("../../../config.js");
var _BasicReducer = require("../../../BasicReducer");
var _uniqueID = require("../../../../shared/uniqueID.js");
var actions = _interopRequireWildcard(require("../uploadsActions"));
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _reduxMockStore = _interopRequireDefault(require("redux-mock-store"));
var notificationsTypes = _interopRequireWildcard(require("../../../Notifications/actions/actionTypes"));
var types = _interopRequireWildcard(require("../actionTypes"));

var _api = _interopRequireDefault(require("../../../utils/api"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const middlewares = [_reduxThunk.default];
const mockStore = (0, _reduxMockStore.default)(middlewares);

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

const mockSuperAgent = (url = `${_config.APIURL}import`) => {
  const mockUpload = _superagent.default.post(url);
  spyOn(mockUpload, 'field').and.returnValue(mockUpload);
  spyOn(mockUpload, 'attach').and.returnValue(mockUpload);
  spyOn(_superagent.default, 'post').and.returnValue(mockUpload);
  return mockUpload;
};

describe('uploadsActions', () => {
  beforeEach(() => {
    (0, _uniqueID.mockID)();
    _fetchMock.default.restore();
    _fetchMock.default.
    post(`${_config.APIURL}documents`, { body: JSON.stringify({ testBackendResult: 'ok' }) }).
    delete(`${_config.APIURL}documents?name=doc&_id=abc1`, { body: JSON.stringify({ testBackendResult: 'ok' }) });
  });

  afterEach(() => _fetchMock.default.restore());

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
        _fetchMock.default.restore();
        _fetchMock.default.
        post(`${_config.APIURL}documents`, { body: JSON.stringify({ _id: 'test', sharedId: 'sharedId' }) });

        const newDoc = { name: 'doc' };
        const store = mockStore({});

        const expectedActions = [
        { type: types.NEW_UPLOAD_DOCUMENT, doc: 'sharedId' },
        { type: types.ELEMENT_CREATED, doc: { _id: 'test', sharedId: 'sharedId' } }];


        store.dispatch(actions.createDocument(newDoc)).
        then(createdDoc => {
          expect(createdDoc).toEqual({ _id: 'test', sharedId: 'sharedId' });
          expect(_fetchMock.default.lastOptions().body).toEqual(JSON.stringify({ name: 'doc' }));
          expect(store.getActions()).toEqual(expectedActions);
          done();
        }).
        catch(done.fail);
      });
    });

    describe('importData', () => {
      it('should upload a file and then import the data', done => {
        const mockUpload = mockSuperAgent();

        const expectedActions = [
        { type: 'importUploadProgress/SET', value: 65 },
        { type: 'importUploadProgress/SET', value: 75 },
        { type: 'importUploadProgress/SET', value: 0 }];

        const store = mockStore({});
        const file = getMockFile();

        store.dispatch(actions.importData([file], '123')).
        then(() => {
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
          metadata: { prop: 'value' },
          template: '123',
          captcha: 23,
          file,
          attachments: [file, file] };

      });

      it('should send the form data and upload the files', done => {
        const mockUpload = mockSuperAgent(`${_config.APIURL}public`);
        store.dispatch(actions.publicSubmit(formData)).
        then(() => {
          delete formData.captcha;
          expect(mockUpload.field).toHaveBeenCalledWith('entity', JSON.stringify({ title: 'test', template: '123', metadata: { prop: 'value' } }));
          expect(mockUpload.field).toHaveBeenCalledWith('captcha', 23);
          expect(mockUpload.attach).toHaveBeenCalledWith('file', file);
          expect(mockUpload.attach).toHaveBeenCalledWith('attachments[0]', file);
          expect(mockUpload.attach).toHaveBeenCalledWith('attachments[1]', file);
          expect(_superagent.default.post).toHaveBeenCalledWith(`${_config.APIURL}public`);
          done();
        });

        emitProgressAndResponse(mockUpload, { text: JSON.stringify({ test: 'test' }), body: 'ok', status: 200 });
      });

      it('should send data to remotepublic if remote is set to true', done => {
        const mockUpload = mockSuperAgent(`${_config.APIURL}remotepublic`);

        store.dispatch(actions.publicSubmit(formData, true)).
        then(() => {
          expect(_superagent.default.post).toHaveBeenCalledWith(`${_config.APIURL}remotepublic`);
          done();
        });

        emitProgressAndResponse(mockUpload, { text: JSON.stringify({ test: 'test' }), body: 'ok', status: 200 });
      });

      it('should return promise that will be resolved after upload is complete', done => {
        const mockUpload = mockSuperAgent(`${_config.APIURL}public`);
        jest.spyOn(store, 'dispatch');
        store.dispatch(actions.publicSubmit(formData)).
        then(progress => {
          progress.promise.then(res => {
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ ok: 1 });
            done();
          });
        });

        emitProgressAndResponse(mockUpload, { text: JSON.stringify({ test: 'test' }), body: { ok: 1 }, status: 200 });
      });

      it('should return promise that rejects if upload completes with error status code', done => {
        const mockUpload = mockSuperAgent(`${_config.APIURL}public`);
        jest.spyOn(store, 'dispatch');
        store.dispatch(actions.publicSubmit(formData)).
        then(progress => {
          progress.promise.catch(res => {
            expect(res.status).toBe(403);
            expect(res.body).toEqual({ error: 'error' });
            done();
          });
        });

        emitProgressAndResponse(mockUpload, { text: JSON.stringify({ error: 'error' }), body: { error: 'error' }, status: 403 });
      });
    });


    describe('uploadDocument', () => {
      it('should create a document and upload file while dispatching the upload progress', () => {
        const mockUpload = mockSuperAgent();

        const expectedActions = [
        { type: types.UPLOAD_PROGRESS, doc: 'abc1', progress: 65 },
        { type: types.UPLOAD_PROGRESS, doc: 'abc1', progress: 75 },
        { type: types.UPLOAD_COMPLETE, doc: 'abc1', file: { filename: 'a', originalname: 'a', size: 1 } }];

        const store = mockStore({});
        const file = getMockFile();

        store.dispatch(actions.uploadDocument('abc1', file));
        expect(mockUpload.field).toHaveBeenCalledWith('document', 'abc1');
        expect(mockUpload.attach).toHaveBeenCalledWith('file', file, file.name);

        emitProgressAndResponse(mockUpload, { text: JSON.stringify({ test: 'test' }), body: { filename: 'a', originalname: 'a', size: 1 } });
        expect(store.getActions()).toEqual(expectedActions);
      });
    });

    describe('uploadCustom', () => {
      it('should upload a file and then add it to the customUploads', done => {
        const mockUpload = mockSuperAgent();

        const expectedActions = [
        { type: types.UPLOAD_PROGRESS, doc: 'customUpload_unique_id', progress: 65 },
        { type: types.UPLOAD_PROGRESS, doc: 'customUpload_unique_id', progress: 75 },
        { type: types.UPLOAD_COMPLETE, doc: 'customUpload_unique_id', file: { filename: 'a', originalname: 'a', size: 1 } },
        _BasicReducer.actions.push('customUploads', { test: 'test' })];

        const store = mockStore({});
        const file = getMockFile();

        store.dispatch(actions.uploadCustom(file)).
        then(() => {
          expect(mockUpload.attach).toHaveBeenCalledWith('file', file, file.name);
          expect(store.getActions()).toEqual(expectedActions);
          done();
        });

        emitProgressAndResponse(mockUpload, { text: JSON.stringify({ test: 'test' }), body: { filename: 'a', originalname: 'a', size: 1 } });
      });
    });

    describe('deleteCustomUpload', () => {
      it('should delete the upload and remove it locally on success', done => {
        spyOn(_api.default, 'delete').and.returnValue(Promise.resolve({ json: { _id: 'deleted' } }));

        const expectedActions = [
        _BasicReducer.actions.remove('customUploads', { _id: 'deleted' })];


        const store = mockStore({});

        store.dispatch(actions.deleteCustomUpload('id')).
        then(() => {
          expect(store.getActions()).toEqual(expectedActions);
          done();
        });
      });
    });

    describe('publishDocument', () => {
      it('should save the document with published:true and dispatch notification on success', done => {
        const document = { name: 'doc', _id: 'abc1' };

        const expectedActions = [
        { type: notificationsTypes.NOTIFY, notification: { message: 'Document published', type: 'success', id: 'unique_id' } },
        { type: types.REMOVE_DOCUMENT, doc: document },
        { type: 'viewer/doc/SET', value: { testBackendResult: 'ok' } },
        { type: 'UNSELECT_ALL_DOCUMENTS' }];

        const store = mockStore({});

        store.dispatch(actions.publishDocument(document)).
        then(() => {
          expect(_fetchMock.default.lastOptions().body).toEqual(JSON.stringify({ name: 'doc', _id: 'abc1', published: true }));
          expect(store.getActions()).toEqual(expectedActions);
        }).
        then(done).
        catch(done.fail);
      });
    });
  });
});