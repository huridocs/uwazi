import { Dispatch } from 'redux';
import { actions } from 'react-redux-form';
import { EntitySchema } from 'shared/types/entityType';

const uploadLocalAttachment = (
  entity: EntitySchema,
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
          ...(entity.sharedId && { entity: entity.sharedId }),
        })
      );
      resolve();
    };
    reader.readAsDataURL(file);
  });

const uploadLocalAttachmentFromUrl = (
  entity: EntitySchema,
  formData: { url: string; name: string },
  __reducerKey: string,
  model: string
) => (dispatch: Dispatch<{}>) => {
  const { name, url } = formData;
  return dispatch(
    actions.push(`${model}.attachments`, {
      originalname: name,
      url,
      ...(entity.sharedId && { entity: entity.sharedId }),
    })
  );
};

export { uploadLocalAttachment, uploadLocalAttachmentFromUrl };
