import { Attachment } from './Attachment';
import { CustomUpload } from './CustomUpload';
import { Document } from './Document';
import { ProcessedDocument } from './ProcessedDocument';
import { Thumbnail } from './Thumbnail';
import { URLAttachment } from './URLAttachment';

export type UwaziFile =
  | Document
  | ProcessedDocument
  | Attachment
  | URLAttachment
  | CustomUpload
  | Thumbnail;
