// eslint-disable-next-line node/no-restricted-import
import { createReadStream, createWriteStream } from 'fs';
// eslint-disable-next-line node/no-restricted-import
import { stat } from 'fs/promises';

import { DiskFile } from '#api/core/infrastructure/files/DiskFile.js';
import { mimeTypeFromUrl } from '#api/files/extensionHelper.js';
import { generateFileName, temporalFilesPath } from '#api/files/filesystem.js';
import date from '#api/utils/date.js';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { CustomUpload } from '../../domain/files/CustomUpload.js';
import { FileAttachment } from '../../domain/files/FileAttachment.js';
import { FileContents } from '../../domain/files/FileContents.js';
import { PDFDocument } from '../../domain/files/PDFDocument.js';
import { URLAttachment } from '../../domain/files/URLAttachment.js';

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

  private type: 'document' | 'attachment' | 'url_attachment' | 'custom' | 'raw';

  constructor(
    metadata: FileMetadata,
    type: 'document' | 'attachment' | 'url_attachment' | 'custom' | 'raw' = 'raw'
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
        return new PDFDocument({ ...fileProps, status: 'processing' });
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

  toCustomFile(id: string) {
    if (this.type !== 'custom') {
      throw new Error('toCustomFile can only be called on custom type InputFiles');
    }
    return new CustomUpload({
      id,
      creationDate: date.currentUTC(),
      ...this.fileProps(),
    });
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
        filename: originalname,
        path: '',
        size: 1,
      },
      'url_attachment'
    );
  }

  static async fromStream({
    stream,
    originalname,
    mimetype,
    type = 'attachment',
    fieldname = 'file',
  }: {
    stream: Readable;
    originalname: string;
    mimetype?: string;
    type?: 'document' | 'attachment';
    fieldname?: string;
  }): Promise<InputFile> {
    const filename = generateFileName({ originalname });
    const destination = temporalFilesPath();
    const filepath = path.join(destination, filename);

    const writeStream = createWriteStream(filepath);
    await pipeline(stream, writeStream);

    const stats = await stat(filepath);

    return new InputFile(
      {
        fieldname,
        originalname,
        encoding: '',
        mimetype: mimetype || mimeTypeFromUrl(originalname),
        destination,
        filename,
        path: filepath,
        size: stats.size,
      },
      type
    );
  }
}
