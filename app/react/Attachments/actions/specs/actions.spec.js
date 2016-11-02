import {APIURL} from 'app/config.js';
import superagent from 'superagent';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as actions from '../actions';
import * as types from '../actionTypes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Attachments actions', () => {
  describe('uploadAttachment', () => {
    let file;
    let mockUpload;
    let store;

    beforeEach(() => {
      mockUpload = superagent.post(APIURL + 'attachments/upload');
      spyOn(mockUpload, 'field').and.callThrough();
      spyOn(mockUpload, 'attach').and.callThrough();
      spyOn(superagent, 'post').and.returnValue(mockUpload);

      store = mockStore({});

      // needed to work with firefox/chrome and phantomjs
      file = {name: 'filename'};
      let isChrome = typeof File === 'function';
      if (isChrome) {
        file = new File([], 'filename');
      }
      //
    });

    fit('should start the upload', () => {
      store.dispatch(actions.uploadAttachment('id', file));
      expect(store.getActions()).toEqual([{type: types.START_UPLOAD_ATTACHMENT, entity: 'id'}]);
    });

    fit('should create upload the file while dispatching the upload progress', () => {
      const expectedActions = [
        {type: types.START_UPLOAD_ATTACHMENT, entity: 'id'},
        {type: types.ATTACHMENT_PROGRESS, entity: 'id', progress: 55},
        {type: types.ATTACHMENT_PROGRESS, entity: 'id', progress: 65},
        {type: types.ATTACHMENT_COMPLETE, entity: 'id', file: {text: 'file'}}
      ];

      store.dispatch(actions.uploadAttachment('id', file));
      expect(mockUpload.field).toHaveBeenCalledWith('entityId', 'id');
      expect(mockUpload.attach).toHaveBeenCalledWith('file', file, file.name);

      mockUpload.emit('progress', {percent: 55.1});
      mockUpload.emit('progress', {percent: 65});
      mockUpload.emit('response', {text: '{"text": "file"}'});
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});
