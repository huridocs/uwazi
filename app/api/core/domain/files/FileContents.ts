import { Readable } from 'stream';

export type StreamCallback = () => AsyncIterable<Uint8Array>;

export class FileContents {
  private streamCallback?: StreamCallback;

  private _getReadable?: () => Promise<Readable>;

  constructor(streamCallback: StreamCallback) {
    this.streamCallback = streamCallback;
  }

  setReadable(getReadable: () => Promise<Readable>) {
    this._getReadable = getReadable;
  }

  async getReadable(): Promise<Readable> {
    if (!this?._getReadable) {
      throw new Error('Readable stream callback not defined');
    }

    return this._getReadable();
  }

  async *read(): AsyncIterable<Uint8Array> {
    if (this.streamCallback) {
      for await (const chunk of this.streamCallback()) {
        yield chunk;
      }
    }
  }
}
