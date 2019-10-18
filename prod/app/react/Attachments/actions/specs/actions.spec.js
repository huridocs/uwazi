"use strict";var _config = require("../../../config.js");
var _api = _interopRequireDefault(require("../../../utils/api"));
var _superagent = _interopRequireDefault(require("superagent"));
var _reduxMockStore = _interopRequireDefault(require("redux-mock-store"));
var _reduxThunk = _interopRequireDefault(require("redux-thunk"));
var _uniqueID = require("../../../../shared/uniqueID.js");
var _reactReduxForm = require("react-redux-form");
var _RequestParams = require("../../../utils/RequestParams");

var actions = _interopRequireWildcard(require("../actions"));
var types = _interopRequireWildcard(require("../actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const middlewares = [_reduxThunk.default];
const mockStore = (0, _reduxMockStore.default)(middlewares);

describe('Attachments actions', () => {
  let store;

  beforeEach(() => {
    store = mockStore({});
  });

  describe('uploadAttachment', () => {
    let file;
    let mockUpload;

    beforeEach(() => {
      mockUpload = _superagent.default.post(`${_config.APIURL}attachments/upload`);
      spyOn(mockUpload, 'field').and.returnValue(mockUpload);
      spyOn(mockUpload, 'attach').and.returnValue(mockUpload);
      spyOn(_superagent.default, 'post').and.returnValue(mockUpload);

      // needed to work with firefox/chrome and phantomjs
      file = { name: 'filename' };
      const isChrome = typeof File === 'function';
      if (isChrome) {
        file = new File([], 'filename');
      }
      //
    });

    it('should start the upload', () => {
      store.dispatch(actions.uploadAttachment('sharedId', file));
      expect(store.getActions()).toEqual([{ type: types.START_UPLOAD_ATTACHMENT, entity: 'sharedId' }]);
    });

    it('should upload the file while dispatching the upload progress', () => {
      const expectedActions = [
      { type: types.START_UPLOAD_ATTACHMENT, entity: 'sharedId' },
      { type: types.ATTACHMENT_PROGRESS, entity: 'sharedId', progress: 55 },
      { type: types.ATTACHMENT_PROGRESS, entity: 'sharedId', progress: 65 },
      { type: types.ATTACHMENT_COMPLETE, entity: 'sharedId', file: { text: 'file' }, __reducerKey: 'storeKey' }];


      store.dispatch(actions.uploadAttachment('sharedId', file, 'storeKey'));
      expect(mockUpload.field).toHaveBeenCalledWith('entityId', 'sharedId');
      expect(mockUpload.field).toHaveBeenCalledWith('allLanguages', false);
      expect(mockUpload.attach).toHaveBeenCalledWith('file', file, file.name);

      mockUpload.emit('progress', { percent: 55.1 });
      mockUpload.emit('progress', { percent: 65 });
      mockUpload.emit('response', { text: '{"text": "file"}' });
      expect(store.getActions()).toEqual(expectedActions);
    });

    it('should upload the file to all languages if option passed', () => {
      store.dispatch(actions.uploadAttachment('id', file, 'storeKey', { allLanguages: true }));
      expect(mockUpload.field).toHaveBeenCalledWith('allLanguages', true);
    });
  });

  describe('renameAttachment', () => {
    beforeEach(() => {
      spyOn(_api.default, 'post').and.returnValue({ then: cb => cb({ json: 'file' }) });
      spyOn(_reactReduxForm.actions, 'reset').and.callFake(form => ({ type: 'formReset', value: form }));
      (0, _uniqueID.mockID)();
    });

    it('should call on attachments/rename, with entity, file id and originalname', () => {
      store.dispatch(actions.renameAttachment('id', 'form', 'storeKey', { _id: 'fid', originalname: 'originalname', language: 'spa' }));

      const expectedActions = [
      { type: 'ATTACHMENT_RENAMED', entity: 'id', file: 'file', __reducerKey: 'storeKey' },
      { type: 'formReset', value: 'form' },
      { type: 'NOTIFY', notification: { message: 'Attachment renamed', type: 'success', id: 'unique_id' } }];


      const expectedParams = new _RequestParams.RequestParams({ entityId: 'id', _id: 'fid', originalname: 'originalname', language: 'spa' });
      expect(_api.default.post).toHaveBeenCalledWith('attachments/rename', expectedParams);
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  describe('deleteAttachment', () => {
    it('should call on attachments/delete, with entity and filename and dispatch deleted and notification actions', done => {
      spyOn(_api.default, 'delete').and.returnValue(Promise.resolve({}));
      (0, _uniqueID.mockID)();
      const dispatch = jasmine.createSpy('dispatch');
      actions.deleteAttachment('id', { _id: 'attachmentId', filename: 'filename' }, 'storeKey')(dispatch).then(() => {
        expect(_api.default.delete).toHaveBeenCalledWith('attachments/delete', new _RequestParams.RequestParams({
          attachmentId: 'attachmentId' }));

        expect(dispatch).toHaveBeenCalledWith({
          type: types.ATTACHMENT_DELETED,
          entity: 'id',
          file: {
            _id: 'attachmentId',
            filename: 'filename' },

          __reducerKey: 'storeKey' });

        done();
      });
    });
  });

  describe('loadForm', () => {
    beforeEach(() => {
      spyOn(_reactReduxForm.actions, 'reset').and.callFake(form => ({ type: 'formReset', value: form }));
      spyOn(_reactReduxForm.actions, 'load').and.callFake((form, attachment) => ({ type: 'formLoad', value: `${form}, ${attachment}` }));
    });

    it('should reset and load passed form', () => {
      store.dispatch(actions.loadForm('form', 'attachment'));

      const expectedActions = [
      { type: 'formReset', value: 'form' },
      { type: 'formLoad', value: 'form, attachment' }];


      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  describe('submitForm', () => {
    beforeEach(() => {
      spyOn(_reactReduxForm.actions, 'submit').and.callFake(form => ({ type: 'formSubmit', value: form }));
    });

    it('should submit the form', () => {
      store.dispatch(actions.submitForm('form'));

      const expectedActions = [
      { type: 'formSubmit', value: 'form' }];


      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  describe('resetForm', () => {
    beforeEach(() => {
      spyOn(_reactReduxForm.actions, 'reset').and.callFake(form => ({ type: 'formReset', value: form }));
    });

    it('should reset and load passed form', () => {
      store.dispatch(actions.resetForm('form'));

      const expectedActions = [
      { type: 'formReset', value: 'form' }];


      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});