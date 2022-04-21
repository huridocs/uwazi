import { Dispatch } from 'redux';
import { actions } from 'react-redux-form';
import { readFileAsBase64 } from 'app/Library/actions/saveEntityWithFiles';
import uniqueID from 'shared/uniqueID';
import * as types from '../../Attachments/actions/actionTypes';

const uploadLocalAttachment =
  (
    entitySharedId: string,
    file: File,
    storeKeys: { __reducerKey: string; model: string },
    fileLocalID?: string
  ) =>
  async (dispatch: Dispatch<{}>): Promise<any> =>
    readFileAsBase64(file, info => {
      const newFile = {
        originalname: file.name,
        filename: file.name,
        serializedFile: info,
        type: 'attachment',
        mimetype: file.type,
        entity: entitySharedId,
        fileLocalID: fileLocalID || uniqueID(),
      };
      dispatch(actions.push(`${storeKeys.model}.attachments`, newFile));
      dispatch({ type: types.ATTACHMENT_PROGRESS, entity: entitySharedId, progress: 100 });
    });

const uploadLocalAttachmentFromUrl =
  (
    entitySharedId: string,
    formData: { url: string; name: string },
    storeKeys: { __reducerKey: string; model: string }
  ) =>
  (dispatch: Dispatch<{}>) => {
    const { name, url } = formData;
    const newUrl = {
      originalname: name,
      url,
      entity: entitySharedId,
    };
    dispatch(actions.push(`${storeKeys.model}.attachments`, newUrl));
    dispatch({ type: types.ATTACHMENT_PROGRESS, entity: entitySharedId, progress: 100 });
  };

const attachmentCompleted = (entitySharedId: string) => (dispatch: Dispatch<{}>) => {
  dispatch({ type: types.ATTACHMENT_LOCAL_COMPLETE, entity: entitySharedId });
};

export { uploadLocalAttachment, uploadLocalAttachmentFromUrl, attachmentCompleted };
