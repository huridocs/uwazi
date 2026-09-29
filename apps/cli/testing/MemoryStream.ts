import { Writable } from 'stream';

/** A Writable that keeps what was written, to assert on stdout/stderr output. */
class MemoryStream extends Writable {
  text = '';

  _write(chunk: Buffer, _encoding: string, callback: () => void) {
    this.text += chunk.toString();
    callback();
  }
}

export { MemoryStream };
