export type StreamCallback = () => AsyncIterable<Uint8Array>;

export class FileContents {
  private streamCallback?: StreamCallback;

  private cleanup?: () => void;

  constructor(streamCallback: StreamCallback, cleanup?: () => void) {
    this.streamCallback = streamCallback;
    this.cleanup = cleanup;
  }

  async *read(): AsyncIterable<Uint8Array> {
    if (this.streamCallback) {
      for await (const chunk of this.streamCallback()) {
        yield chunk;
      }
    }
  }

  destroy(): void {
    if (this.cleanup) {
      this.cleanup();
    }
  }
}
