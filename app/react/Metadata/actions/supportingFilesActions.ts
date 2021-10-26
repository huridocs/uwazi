import { Dispatch } from 'redux';
import { actions } from 'react-redux-form';
import { readFileAsBase64 } from 'app/Library/actions/saveEntityWithFiles';
import * as types from '../../Attachments/actions/actionTypes';

const uploadLocalAttachment = (
  entitySharedId: string,
  file: File,
  __reducerKey: string,
  model: string
) => async (dispatch: Dispatch<{}>): Promise<any> =>
  readFileAsBase64(file, info => {
    const newFile = {
      originalname: file.name,
      filename: file.name,
      serializedFile: info,
      type: 'attachment',
      mimetype: file.type,
      entity: entitySharedId,
    };
    dispatch(actions.push(`${model}.attachments`, newFile));
    dispatch({ type: types.ATTACHMENT_PROGRESS, entity: entitySharedId, progress: 100 });
    dispatch({
      type: types.ATTACHMENT_COMPLETE,
      entity: entitySharedId,
      file: newFile,
      __reducerKey,
    });
  });

const uploadLocalAttachmentFromUrl = (
  entitySharedId: string,
  formData: { url: string; name: string },
  __reducerKey: string,
  model: string
) => (dispatch: Dispatch<{}>) => {
  const { name, url } = formData;
  const newUrl = {
    originalname: name,
    url,
    entity: entitySharedId,
  };
  dispatch({ type: types.ATTACHMENT_PROGRESS, entity: entitySharedId, progress: 100 });
  dispatch({
    type: types.ATTACHMENT_COMPLETE,
    entity: entitySharedId,
    file: newUrl,
    __reducerKey,
  });
  return dispatch(actions.push(`${model}.attachments`, newUrl));
};

export { uploadLocalAttachment, uploadLocalAttachmentFromUrl };
