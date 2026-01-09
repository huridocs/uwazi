export type StreamCallback = () => AsyncIterable<Uint8Array>;

export class FileContents {
  private streamCallback?: StreamCallback;

  constructor(streamCallback: StreamCallback) {
    this.streamCallback = streamCallback;
  }

  async *read(): AsyncIterable<Uint8Array> {
    if (this.streamCallback) {
      yield* this.streamCallback();
    }
  }
}
