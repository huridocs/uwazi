// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';

import path from 'path';
import { mimeTypeFromUrl } from 'api/files/extensionHelper';
import { DiskFile } from './DiskFile';
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
  url?: string;
};

type CreateUrlAttachmentProps = {
  originalname: string;
  url: string;
};

export class InputFile {
  private _metadata: FileMetadata;

  private type: 'document' | 'attachment' | 'url_attachment' | 'raw';

  constructor(
    metadata: FileMetadata,
    type: 'document' | 'attachment' | 'url_attachment' | 'raw' = 'raw'
  ) {
    this._metadata = metadata;
    this.type = type;
  }

  isDocument() {
    return this.type === 'document';
  }

  isAttachment() {
    return this.type === 'attachment';
  }

  isUrlAttachment() {
    return this.type === 'url_attachment';
  }

  get filename() {
    return this._metadata.filename;
  }

  get filepath() {
    return path.join(this._metadata.destination, this._metadata.filename);
  }

  get file() {
    return new DiskFile(this.filepath);
  }

  get content() {
    const { filepath } = this;
    return new FileContents(async function* streamCallback() {
      const stream = createReadStream(filepath);
      for await (const chunk of stream) yield chunk;
    });
  }

  get metadata() {
    return {
      originalname: this._metadata.originalname,
      mimetype: this._metadata.mimetype,
      size: this._metadata.size,
      url: this._metadata.url,
    };
  }

  static createUrlAttachment({ originalname, url }: CreateUrlAttachmentProps) {
    return new InputFile(
      {
        mimetype: mimeTypeFromUrl(url),
        originalname,
        url,

        destination: '',
        encoding: '',
        fieldname: '',
        filename: '',
        path: '',
        size: 0,
      },
      'url_attachment'
    );
  }
}
