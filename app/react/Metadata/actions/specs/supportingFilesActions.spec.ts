/**
 * @jest-environment jsdom
 */
import { Dispatch } from 'redux';
import { actions as formActions } from 'react-redux-form';
import { uploadLocalAttachment, uploadLocalAttachmentFromUrl } from '../supportingFilesActions';

const file = new File(['testFile'], 'testFile.txt', {
  type: 'text/plain',
});

describe('upload supporting files', () => {
  let dispatch: Dispatch<{}>;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    spyOn(formActions, 'push');
  });

  describe('uploadLocalAttachmentFromUrl', () => {
    it('should dispatch the action to update the form', () => {
      const action = uploadLocalAttachmentFromUrl(
        'entitySharedId',
        { url: 'https://test.com', name: 'myURL' },
        { __reducerKey: 'reducerKey', model: 'metadata.model' }
      );
      action(dispatch);
      expect(formActions.push).toHaveBeenCalledWith('metadata.model.attachments', {
        entity: 'entitySharedId',
        originalname: 'myURL',
        url: 'https://test.com',
      });
    });
  });

  describe('uploadLocalAttachment', () => {
    it('should dispatch the action to update the form', async () => {
      const action = uploadLocalAttachment('entitySharedId', file, {
        __reducerKey: 'reducerKey',
        model: 'metadata.model',
      });
      await action(dispatch);
      expect(formActions.push).toHaveBeenCalledWith('metadata.model.attachments', {
        entity: 'entitySharedId',
        fileLocalID: expect.stringMatching(/^[a-zA-Z\d_]*$/),
        filename: 'testFile.txt',
        mimetype: 'text/plain',
        originalname: 'testFile.txt',
        serializedFile: 'data:text/plain;base64,dGVzdEZpbGU=',
        type: 'attachment',
      });
    });
  });
});
