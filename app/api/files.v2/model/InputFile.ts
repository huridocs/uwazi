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

  constructor(metadata: FileMetadata) {
    this._metadata = metadata;
  }

  get filename() {
    return this._metadata.filename;
  }

  get contents() {
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
