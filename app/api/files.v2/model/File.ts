// eslint-disable-next-line node/no-restricted-import
import { createWriteStream } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

type Source = Readable;

export type FileProps = {
  filename: string;
  source: Source;
};

export class File {
  filename: string;

  source: Source;

  constructor(props: FileProps) {
    this.filename = props.filename;
    this.source = props.source;
  }

  async toBuffer(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const _buf: Buffer[] = [];
      this.source.on('data', (chunk: any) => _buf.push(chunk));
      this.source.on('end', () => resolve(Buffer.concat(_buf)));
      this.source.on('error', (err: unknown) => reject(err));
    });
  }

  async asContentString(): Promise<string> {
    const buffer = await this.toBuffer();
    return buffer.toString('utf8');
  }

  async asTmpDiskFile() {
    const filePath = path.join(
      tmpdir(),
      `${Date.now()}_${Math.random()}${path.extname(this.filename)}`
    );
    await pipeline(this.source, createWriteStream(filePath));
    return filePath;
  }
}
