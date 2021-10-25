/**
 * @jest-environment jsdom
 */
import { Dispatch } from 'redux';
import { actions as formActions } from 'react-redux-form';
import { ClientEntitySchema } from 'app/istore';
import { uploadLocalAttachment, uploadLocalAttachmentFromUrl } from '../supportingFilesActions';

const entity: ClientEntitySchema = {
  _id: 'entity._id',
};

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
        entity,
        { url: 'https://test.com', name: 'myURL' },
        'reducerKey',
        'metadata.model'
      );
      action(dispatch);
      expect(formActions.push).toHaveBeenCalledWith('metadata.model.attachments', {
        originalname: 'myURL',
        url: 'https://test.com',
      });
    });
  });

  describe('uploadLocalAttachment', () => {
    it('should dispatch the action to update the form', async () => {
      const action = uploadLocalAttachment(entity, file, 'reducerKey', 'metadata.model');
      await action(dispatch);
      expect(formActions.push).toHaveBeenCalledWith('metadata.model.attachments', {
        filename: 'testFile.txt',
        mimetype: 'text/plain',
        originalname: 'testFile.txt',
        serializedFile: 'data:text/plain;charset=undefined,testFile',
        type: 'attachment',
      });
    });
  });
});
