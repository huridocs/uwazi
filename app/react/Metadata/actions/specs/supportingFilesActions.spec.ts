import { Dispatch } from 'redux';
import { actions as formActions } from 'react-redux-form';
import { ClientEntitySchema } from 'app/istore';

import { uploadLocalAttachmentFromUrl } from '../supportingFilesActions';

const entity: ClientEntitySchema = {
  _id: 'entity._id',
};

describe('upload supporting files', () => {
  let dispatch: Dispatch<{}>;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    spyOn(formActions, 'push');
  });

  describe('uploadLocalAttachmentFromUrl', () => {
    it('should dispatch the action to update en form', () => {
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
});
