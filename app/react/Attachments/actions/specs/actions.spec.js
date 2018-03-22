import {APIURL} from 'app/config.js';
import api from 'app/utils/api';
import superagent from 'superagent';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {mockID} from 'shared/uniqueID.js';
import {actions as formActions} from 'react-redux-form';

import * as actions from '../actions';
import * as types from '../actionTypes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Attachments actions', () => {
  let store;

  beforeEach(() => {
    store = mockStore({});
  });

  describe('uploadAttachment', () => {
    let file;
    let mockUpload;

    beforeEach(() => {
      mockUpload = superagent.post(APIURL + 'attachments/upload');
      spyOn(mockUpload, 'field').and.returnValue(mockUpload);
      spyOn(mockUpload, 'attach').and.returnValue(mockUpload);
      spyOn(superagent, 'post').and.returnValue(mockUpload);

      // needed to work with firefox/chrome and phantomjs
      file = {name: 'filename'};
      let isChrome = typeof File === 'function';
      if (isChrome) {
        file = new File([], 'filename');
      }
      //
    });

    it('should start the upload', () => {
      store.dispatch(actions.uploadAttachment('id', file));
      expect(store.getActions()).toEqual([{type: types.START_UPLOAD_ATTACHMENT, entity: 'id'}]);
    });

    it('should upload the file while dispatching the upload progress', () => {
      const expectedActions = [
        {type: types.START_UPLOAD_ATTACHMENT, entity: 'id'},
        {type: types.ATTACHMENT_PROGRESS, entity: 'id', progress: 55},
        {type: types.ATTACHMENT_PROGRESS, entity: 'id', progress: 65},
        {type: types.ATTACHMENT_COMPLETE, entity: 'id', file: {text: 'file'}, __reducerKey: 'storeKey'}
      ];

      store.dispatch(actions.uploadAttachment('id', file, 'storeKey'));
      expect(mockUpload.field).toHaveBeenCalledWith('entityId', 'id');
      expect(mockUpload.field).toHaveBeenCalledWith('allLanguages', false);
      expect(mockUpload.attach).toHaveBeenCalledWith('file', file, file.name);

      mockUpload.emit('progress', {percent: 55.1});
      mockUpload.emit('progress', {percent: 65});
      mockUpload.emit('response', {text: '{"text": "file"}'});
      expect(store.getActions()).toEqual(expectedActions);
    });

    it('should upload the file to all languages if option passed', () => {
      store.dispatch(actions.uploadAttachment('id', file, 'storeKey', {allLanguages: true}));
      expect(mockUpload.field).toHaveBeenCalledWith('allLanguages', true);
    });
  });

  describe('renameAttachment', () => {
    beforeEach(() => {
      spyOn(api, 'post').and.returnValue({then: (cb) => cb({json: 'file'})});
      spyOn(formActions, 'reset').and.callFake(form => {
        return {type: 'formReset', value: form};
      });
      mockID();
    });

    it('should call on attachments/rename, with entity, file id and originalname', () => {
      store.dispatch(actions.renameAttachment('id', 'form', 'storeKey', {_id: 'fid', originalname: 'originalname', language: 'spa'}));

      const expectedActions = [
        {type: 'ATTACHMENT_RENAMED', entity: 'id', file: 'file', __reducerKey: 'storeKey'},
        {type: 'formReset', value: 'form'},
        {type: 'NOTIFY', notification: {message: 'Attachment renamed', type: 'success', id: 'unique_id'}}
      ];

      expect(api.post).toHaveBeenCalledWith('attachments/rename', {entityId: 'id', _id: 'fid', originalname: 'originalname', language: 'spa'});
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  describe('deleteAttachment', () => {
    beforeEach(() => {
      spyOn(api, 'delete').and.returnValue({then: (cb) => cb()});
      mockID();
    });

    it('should call on attachments/delete, with entity and filename and dispatch deleted and notification actions', () => {
      store.dispatch(actions.deleteAttachment('id', {filename: 'filename'}, 'storeKey'));

      const expectedActions = [
        {type: types.ATTACHMENT_DELETED, entity: 'id', file: {filename: 'filename'}, __reducerKey: 'storeKey'},
        {type: 'NOTIFY', notification: {message: 'Attachment deleted', type: 'success', id: 'unique_id'}}
      ];

      expect(api.delete).toHaveBeenCalledWith('attachments/delete', {entityId: 'id', filename: 'filename'});
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  describe('loadForm', () => {
    beforeEach(() => {
      spyOn(formActions, 'reset').and.callFake(form => {
        return {type: 'formReset', value: form};
      });
      spyOn(formActions, 'load').and.callFake((form, attachment) => {
        return {type: 'formLoad', value: form + ', ' + attachment};
      });
    });

    it('should reset and load passed form', () => {
      store.dispatch(actions.loadForm('form', 'attachment'));

      const expectedActions = [
        {type: 'formReset', value: 'form'},
        {type: 'formLoad', value: 'form, attachment'}
      ];

      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  describe('submitForm', () => {
    beforeEach(() => {
      spyOn(formActions, 'submit').and.callFake(form => {
        return {type: 'formSubmit', value: form};
      });
    });

    it('should submit the form', () => {
      store.dispatch(actions.submitForm('form'));

      const expectedActions = [
        {type: 'formSubmit', value: 'form'}
      ];

      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  describe('resetForm', () => {
    beforeEach(() => {
      spyOn(formActions, 'reset').and.callFake(form => {
        return {type: 'formReset', value: form};
      });
    });

    it('should reset and load passed form', () => {
      store.dispatch(actions.resetForm('form'));

      const expectedActions = [
        {type: 'formReset', value: 'form'}
      ];

      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});
