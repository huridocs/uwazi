import path from 'path';
import { FileContents } from './FileContents';

type FileMetadata = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
};

export class InputFile {
  private _metadata: FileMetadata;

  private type: 'document' | 'attachment';

  constructor(metadata: FileMetadata, type: 'document' | 'attachment') {
    this._metadata = metadata;
    this.type = type;
  }

  isDocument() {
    return this.type === 'document';
  }

  isAttachment() {
    return this.type === 'attachment';
  }

  get filename() {
    return this._metadata.filename;
  }

  get content() {
    return new FileContents(path.join(this._metadata.destination, this._metadata.filename));
  }

  get metadata() {
    return {
      originalname: this._metadata.originalname,
      mimetype: this._metadata.mimetype,
      size: this._metadata.size,
    };
  }
}
