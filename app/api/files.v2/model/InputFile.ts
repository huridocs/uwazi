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
  private _file: FileContents;

  private _metadata: FileMetadata;

  constructor(metadata: FileMetadata) {
    this._metadata = metadata;
    this._file = new FileContents(path.join(metadata.destination, metadata.filename));
  }

  get contents() {
    return this._file;
  }

  get metadata() {
    return {
      originalname: this._metadata.originalname,
      mimetype: this._metadata.mimetype,
      size: this._metadata.size,
    };
  }
}
