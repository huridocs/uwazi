// eslint-disable-next-line node/no-restricted-import
import { existsSync, mkdirSync, writeFileSync } from 'fs';
// eslint-disable-next-line node/no-restricted-import
import { readFile, unlink } from 'fs/promises';

import { FileContentsIO } from 'api/core/infrastructure/files/FileContentIO';
import { tmpdir } from 'os';
import path from 'path';
import { FileContents } from 'api/files.v2/model/FileContents';

describe('FileContentsIO', () => {
  const testDir = path.join(tmpdir(), 'fileContents-tests');
  const testFilePath = path.join(testDir, 'test-file.txt');
  const testContent = 'Hello, World! This is a test file content.';
  const fileIO = new FileContentsIO();

  beforeEach(() => {
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
    writeFileSync(testFilePath, testContent, 'utf8');
  });

  afterEach(async () => {
    if (await readFile(testFilePath)) {
      await unlink(testFilePath);
    }
  });

  describe('from disk file', () => {
    describe('constructor', () => {
      it('should create a FileContents instance with filename and filepath', () => {
        const file = new FileContents(testFilePath);

        expect(file.filename).toBe('test-file.txt');
        expect(file.getFullPath().getDataOrThrow()).toBe(testFilePath);
      });
    });

    describe('size', () => {
      it('should return the size in bytes', async () => {
        const file = new FileContents(testFilePath);
        expect((await fileIO.size(file)).getData()).toBe(42);
      });
    });

    describe('toDisk', () => {
      it('should return itself (already on disk)', async () => {
        const file = new FileContents(testFilePath);
        expect(await fileIO.toDisk(file)).toBe(file);
      });
    });

    describe('toBuffer', () => {
      it('should return file content as buffer', async () => {
        const file = new FileContents(testFilePath);

        const buffer = (await fileIO.toBuffer(file)).getDataOrThrow();
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.toString('utf8')).toBe(testContent);
      });
    });

    describe('asContentString', () => {
      it('should return file content as string', async () => {
        const file = new FileContents(testFilePath);

        const content = (await fileIO.asContentString(file)).getDataOrThrow();
        expect(content).toBe(testContent);
        expect(typeof content).toBe('string');
      });
    });
  });

  describe('from a callback iterable', () => {
    describe('constructor', () => {
      it('should create FileContents with callback object', () => {
        const streamCallback = jest.fn(async function* streamCallback() {
          yield Buffer.from('callback content');
        });
        const fileContents = new FileContents({
          filename: 'callback-file.txt',
          streamCallback,
        });

        expect(fileContents.filename).toBe('callback-file.txt');
        expect(streamCallback).not.toHaveBeenCalled();
      });
    });

    describe('toDisk', () => {
      it('should return a new FileContents object stored on disk', async () => {
        async function* streamCallback() {
          yield Buffer.from('callback content');
        }
        const fileContents = new FileContents({
          filename: 'callback-file.txt',
          streamCallback,
        });

        const diskContents = await fileIO.toDisk(fileContents);
        const diskFullPath = diskContents.getFullPath().getDataOrThrow();

        expect(await readFile(diskFullPath, 'utf8')).toBe('callback content');
      });
    });

    describe('getReadable()', () => {
      it('should return a file contents asyncIterable', async () => {
        const callbackContent = 'multiple reads content';
        async function* streamCallback() {
          yield Buffer.from(callbackContent);
        }

        const fileContents = new FileContents({ filename: 'multiple-reads.txt', streamCallback });

        let result = '';
        for await (const chunk of fileContents.read()) {
          result += chunk;
        }

        expect(result).toBe(callbackContent);
      });
    });

    describe('toBuffer()', () => {
      it('should return buffer from callback', async () => {
        const callbackContent = 'async callback buffer content';

        async function* streamCallback() {
          yield Buffer.from(callbackContent);
        }
        const fileContents = new FileContents({ filename: 'async-buffer.txt', streamCallback });

        const buffer = (await fileIO.toBuffer(fileContents)).getDataOrThrow();

        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.toString('utf8')).toBe(callbackContent);
      });
    });

    describe('asContentString()', () => {
      it('should return string content from callback', async () => {
        const callbackContent = 'callback string content';
        async function* streamCallback() {
          yield Buffer.from(callbackContent);
        }
        const fileContents = new FileContents({ filename: 'callback-string.txt', streamCallback });

        const content = (await fileIO.asContentString(fileContents)).getDataOrThrow();

        expect(typeof content).toBe('string');
        expect(content).toBe(callbackContent);
      });
    });

    describe('callback error handling', () => {
      function createThrowingIterator(errorMessage: string): AsyncIterable<Uint8Array> {
        return {
          [Symbol.asyncIterator]() {
            return {
              async next() {
                throw new Error(errorMessage);
              },
            };
          },
        };
      }
      it('should throw error when callback throws', async () => {
        const errorMessage = 'Callback error';
        const fileContents = new FileContents({
          filename: 'error-callback.txt',
          streamCallback: () => createThrowingIterator(errorMessage),
        });

        await expect(async () =>
          (await fileIO.toBuffer(fileContents)).getDataOrThrow()
        ).rejects.toThrow(errorMessage);
      });

      it('should throw error when async callback rejects', async () => {
        const errorMessage = 'Async callback error';
        const fileContents = new FileContents({
          filename: 'async-error-callback.txt',
          streamCallback: () => createThrowingIterator(errorMessage),
        });

        await expect(async () =>
          (await fileIO.toBuffer(fileContents)).getDataOrThrow()
        ).rejects.toThrow(errorMessage);
      });
    });
  });
});
