import { Dispatch } from 'redux';
import { EntitySchema } from 'shared/types/entityType';
import { actions } from 'react-redux-form';

const uploadLocalAttachment = (_entity: EntitySchema, file: File, __reducerKey: string) => (
  dispatch: Dispatch<{}>
) => {
  dispatch(
    actions.push('library.sidepanel.metadata.attachments', {
      originalname: file.name,
      location: URL.createObjectURL(file),
      type: 'attachment',
      mimetype: file.type,
    })
  );
};

const uploadLocalAttachmentFromUrl = (
  entity: EntitySchema,
  name: string,
  url: string,
  __reducerKey: string
) => (dispatch: Dispatch<{}>) => {
  dispatch(
    actions.push('library.sidepanel.metadata.attachments', {
      originalname: name,
      url,
      ...(entity.sharedId && { entity: entity.sharedId }),
    })
  );
};

export { uploadLocalAttachment, uploadLocalAttachmentFromUrl };

// URL object
// {
//   _id: '617186495c0c2b453378497e',
//   originalname: 'testURL',
//   url: 'https://...',
//   entity: 'q513ogyszi',
//   type: 'attachment',
//   mimetype: 'image/jpeg',
//   creationDate: 1634829897888,
//   __v: 0
// }
