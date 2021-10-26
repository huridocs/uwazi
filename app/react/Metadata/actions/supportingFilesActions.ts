import { Dispatch } from 'redux';
import { actions } from 'react-redux-form';
import { readFileAsBase64 } from 'app/Library/actions/saveEntityWithFiles';

const uploadLocalAttachment = (
  entity: string,
  file: File,
  __reducerKey: string,
  model: string
) => async (dispatch: Dispatch<{}>): Promise<any> =>
  readFileAsBase64(file, info => {
    dispatch(
      actions.push(`${model}.attachments`, {
        originalname: file.name,
        filename: file.name,
        serializedFile: info,
        type: 'attachment',
        mimetype: file.type,
        entity: entity || '',
      })
    );
  });

const uploadLocalAttachmentFromUrl = (
  entity: string,
  formData: { url: string; name: string },
  __reducerKey: string,
  model: string
) => (dispatch: Dispatch<{}>) => {
  const { name, url } = formData;
  return dispatch(
    actions.push(`${model}.attachments`, {
      originalname: name,
      url,
      entity: entity || '',
    })
  );
};

export { uploadLocalAttachment, uploadLocalAttachmentFromUrl };
