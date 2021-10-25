import { Dispatch } from 'redux';
import { actions } from 'react-redux-form';

const uploadLocalAttachment = (
  entity: string,
  file: File,
  __reducerKey: string,
  model: string
) => async (dispatch: Dispatch<{}>): Promise<void> =>
  new Promise(resolve => {
    const reader = new FileReader();

    reader.onload = base64 => {
      const info = base64.target!.result;
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
      resolve();
    };
    reader.readAsDataURL(file);
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
