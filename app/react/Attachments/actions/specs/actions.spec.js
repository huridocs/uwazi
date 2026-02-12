import { APIURL } from '#app/config.js';
import api from '#app/utils/api.js';
import superagent from 'superagent';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { mockID } from '#shared/uniqueID.js';
import { actions as formActions } from 'react-redux-form';
import { RequestParams } from '#app/utils/RequestParams.js';

import { NOTIFY } from '#app/Notifications/actions/actionTypes.js';
import * as actions from '../actions.js';
import * as types from '../actionTypes.js';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Attachments actions', () => {
  let store;

  beforeEach(() => {
    store = mockStore({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('uploadAttachment', () => {
    let file;
    let mockUpload;

    beforeEach(() => {
      mockUpload = superagent.post(`${APIURL}attachments/upload`);
      jest.spyOn(mockUpload, 'field').mockReturnValue(mockUpload);
      jest.spyOn(mockUpload, 'attach').mockReturnValue(mockUpload);
      jest.spyOn(mockUpload, 'end').mockReturnValue(mockUpload);
      jest.spyOn(superagent, 'post').mockReturnValue(mockUpload);

      file = { name: 'filename' };
      if (typeof File === 'function') {
        file = new File([], 'filename');
      }
    });

    it('should start the upload', () => {
      store.dispatch(actions.uploadAttachment('sharedId', file));
      expect(store.getActions()).toEqual([
        { type: types.START_UPLOAD_ATTACHMENT, entity: 'sharedId' },
      ]);
    });

    it('should upload the file while dispatching the upload progress', () => {
      const expectedActions = [
        { type: types.START_UPLOAD_ATTACHMENT, entity: 'sharedId' },
        { type: types.ATTACHMENT_PROGRESS, entity: 'sharedId', progress: 55 },
        { type: types.ATTACHMENT_PROGRESS, entity: 'sharedId', progress: 65 },
        { type: types.ATTACHMENT_PROGRESS, entity: 'sharedId', progress: 100 },
        {
          type: types.ATTACHMENT_COMPLETE,
          entity: 'sharedId',
          file: { text: 'file' },
          __reducerKey: 'storeKey',
        },
        {
          type: NOTIFY,
          notification: {
            message: 'Attachment uploaded',
            type: 'success',
          },
        },
      ];

      store.dispatch(actions.uploadAttachment('sharedId', file, { __reducerKey: 'storeKey' }));
      expect(mockUpload.field).toHaveBeenCalledWith('entity', 'sharedId');
      expect(mockUpload.field).toHaveBeenCalledWith('originalname', file.name);
      expect(mockUpload.attach).toHaveBeenCalledWith('file', file);

      mockUpload.emit('progress', { percent: 55.1 });
      mockUpload.emit('progress', { percent: 65 });
      mockUpload.emit('response', { text: '{"text": "file"}' });
      expect(store.getActions()).toMatchObject(expectedActions);
    });
  });

  describe('uploadAttachmentFromUrl', () => {
    it('should post the url and dispatch the upload progress and notification upon completion', () => {
      const formData = {
        name: 'fileName',
        url: 'URL',
      };
      jest.spyOn(api, 'post').mockReturnValue({ then: cb => cb({ json: { text: 'file' } }) });
      const expectedActions = [
        { type: types.START_UPLOAD_ATTACHMENT, entity: 'sharedId' },
        { type: types.ATTACHMENT_PROGRESS, entity: 'sharedId', progress: 100 },
        {
          type: types.ATTACHMENT_COMPLETE,
          entity: 'sharedId',
          file: { text: 'file' },
          __reducerKey: 'storeKey',
        },
        {
          type: NOTIFY,
          notification: {
            message: 'Attachment uploaded',
            type: 'success',
          },
        },
      ];
      store.dispatch(
        actions.uploadAttachmentFromUrl('sharedId', formData, { __reducerKey: 'storeKey' })
      );
      expect(store.getActions()).toMatchObject(expectedActions);
    });
  });

  describe('renameAttachment', () => {
    beforeEach(() => {
      jest.spyOn(api, 'post').mockReturnValue({ then: cb => cb({ json: 'file' }) });
      jest
        .spyOn(formActions, 'reset')
        .mockImplementation(form => ({ type: 'formReset', value: form }));
      mockID();
    });

    it('should call on files, with entity, file id and originalname', () => {
      store.dispatch(
        actions.renameAttachment('id', 'form', 'storeKey', {
          _id: 'fid',
          originalname: 'originalname',
          language: 'spa',
        })
      );

      const expectedActions = [
        { type: 'ATTACHMENT_RENAMED', entity: 'id', file: 'file', __reducerKey: 'storeKey' },
        { type: 'formReset', value: 'form' },
        {
          type: 'NOTIFY',
          notification: { message: 'Attachment renamed', type: 'success', id: 'unique_id' },
        },
      ];

      const expectedParams = new RequestParams({
        _id: 'fid',
        originalname: 'originalname',
      });
      expect(api.post).toHaveBeenCalledWith('files', expectedParams);
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  describe('deleteAttachment', () => {
    it('should call on attachments/delete, with entity and filename and dispatch deleted and notification actions', done => {
      jest.spyOn(api, 'delete').mockResolvedValue({});
      mockID();
      const dispatch = jest.fn();
      actions
        .deleteAttachment(
          'id',
          { _id: 'attachmentId', filename: 'filename' },
          'storeKey'
        )(dispatch)
        .then(() => {
          expect(api.delete).toHaveBeenCalledWith(
            'files',
            new RequestParams({
              _id: 'attachmentId',
            })
          );
          expect(dispatch).toHaveBeenCalledWith({
            type: types.ATTACHMENT_DELETED,
            entity: 'id',
            file: {
              _id: 'attachmentId',
              filename: 'filename',
            },
            __reducerKey: 'storeKey',
          });
          done();
        });
    });
  });

  describe('loadForm', () => {
    beforeEach(() => {
      jest
        .spyOn(formActions, 'reset')
        .mockImplementation(form => ({ type: 'formReset', value: form }));
      jest.spyOn(formActions, 'load').mockImplementation((form, attachment) => ({
        type: 'formLoad',
        value: `${form}, ${attachment}`,
      }));
    });

    it('should reset and load passed form', () => {
      store.dispatch(actions.loadForm('form', 'attachment'));

      const expectedActions = [
        { type: 'formReset', value: 'form' },
        { type: 'formLoad', value: 'form, attachment' },
      ];

      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  describe('submitForm', () => {
    beforeEach(() => {
      jest
        .spyOn(formActions, 'submit')
        .mockImplementation(form => ({ type: 'formSubmit', value: form }));
    });

    it('should submit the form', () => {
      store.dispatch(actions.submitForm('form'));

      const expectedActions = [{ type: 'formSubmit', value: 'form' }];

      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  describe('resetForm', () => {
    beforeEach(() => {
      jest
        .spyOn(formActions, 'reset')
        .mockImplementation(form => ({ type: 'formReset', value: form }));
    });

    it('should reset and load passed form', () => {
      store.dispatch(actions.resetForm('form'));

      const expectedActions = [{ type: 'formReset', value: 'form' }];

      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});
