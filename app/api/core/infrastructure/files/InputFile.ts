// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';

import { DiskFile } from '#api/core/infrastructure/files/DiskFile.js';
import { mimeTypeFromUrl } from '#api/files/extensionHelper.js';
import date from '#api/utils/date.js';
import path from 'path';
import { FileAttachment } from '#api/core/domain/files/FileAttachment.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { ProcessingPDF } from '#api/core/domain/files/ProcessingPDF.js';
import { URLAttachment } from '#api/core/domain/files/URLAttachment.js';

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

  private fileProps() {
    return { ...this.metadata, filename: this.filename, uploaded: true, content: this.content };
  }

  toEntityFile(entity: string, id: string) {
    const fileProps = { entity, id, creationDate: date.currentUTC(), ...this.fileProps() };

    switch (this.type) {
      case 'document':
        return new ProcessingPDF({ ...fileProps, status: 'processing' });
      case 'attachment':
        return new FileAttachment(fileProps);
      case 'url_attachment':
        if (typeof fileProps.url === 'string') {
          return new URLAttachment({ ...fileProps, url: fileProps.url });
        }
        throw new Error('url_attachment needs a url defined');
      case 'raw':
        throw new Error('raw is not a valid inputFile type to to map to an entityFile');
      default:
        throw new Error(`${this.type} is not a valid inputFile type`);
    }
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
