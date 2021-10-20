import { Dispatch } from 'redux';
import { EntitySchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';
import { actions } from 'react-redux-form';

const uploadLocalAttachment = (_entity: EntitySchema, file, __reducerKey: string) => {
  console.log('calling uploadLocalAttachment');
  return (dispatch: Dispatch<{}>) => {
    console.log('dispatching uploadLocalAttachment');
    console.log('uploading: ', file);
    dispatch(actions.push('library.sidepanel.metadata.attachments', { fileName: file.name }));
  };
};

const uploadLocalAttachmentFromUrl = (
  _entity: EntitySchema,
  _file: FileType,
  __reducerKey: string
) => console.log('calling uploadLocalAttachmentFromUrl');

export { uploadLocalAttachment, uploadLocalAttachmentFromUrl };
