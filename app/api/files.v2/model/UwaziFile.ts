import { Attachment } from './Attachment';
import { CustomUpload } from './CustomUpload';
import { Document } from './Document';
import { URLAttachment } from './URLAttachment';

export type UwaziFile = Document | Attachment | URLAttachment | CustomUpload;
