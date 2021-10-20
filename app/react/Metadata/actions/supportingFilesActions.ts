import { EntitySchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';

const uploadLocalAttachment = (_entity: EntitySchema, _file: FileType, __reducerKey: string) =>
  console.log('calling uploadLocalAttachment');

const uploadLocalAttachmentFromUrl = (
  _entity: EntitySchema,
  _file: FileType,
  __reducerKey: string
) => console.log('calling uploadLocalAttachmentFromUrl');

export { uploadLocalAttachment, uploadLocalAttachmentFromUrl };
