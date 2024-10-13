import { S3Storage, S3TimeoutError } from '../S3Storage';

let s3Storage: S3Storage;

class S3TimeoutClient {
  // eslint-disable-next-line class-methods-use-this
  send() {
    const error = new Error();
    error.name = 'TimeoutError';
    throw error;
  }
}

describe('s3Storage', () => {
  beforeAll(async () => {
    // @ts-ignore
    s3Storage = new S3Storage(new S3TimeoutClient());
  });

  describe('get', () => {
    it('should throw S3TimeoutError on timeout', async () => {
      await expect(s3Storage.get('dummy_key')).rejects.toBeInstanceOf(S3TimeoutError);
    });
  });

  describe('upload', () => {
    it('should throw S3TimeoutError on timeout', async () => {
      await expect(
        s3Storage.upload('dummy_key', Buffer.from('dummy buffer', 'utf-8'))
      ).rejects.toBeInstanceOf(S3TimeoutError);
    });
  });

  describe('delete', () => {
    it('should throw S3TimeoutError on timeout', async () => {
      await expect(s3Storage.delete('dummy_key')).rejects.toBeInstanceOf(S3TimeoutError);
    });
  });

  describe('list', () => {
    it('should throw S3TimeoutError on timeout', async () => {
      await expect(s3Storage.list()).rejects.toBeInstanceOf(S3TimeoutError);
    });
  });
});
