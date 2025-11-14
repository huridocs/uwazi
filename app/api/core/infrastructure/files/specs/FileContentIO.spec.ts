// eslint-disable-next-line node/no-restricted-import
import { existsSync, mkdirSync, writeFileSync } from 'fs';
// eslint-disable-next-line node/no-restricted-import
import { readFile, unlink } from 'fs/promises';

import { FileContentsIO } from 'api/core/infrastructure/files/FileContentIO';
import { FileContents } from 'api/files.v2/model/FileContents';
import { tmpdir } from 'os';
import path from 'path';

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

  describe('toDisk', () => {
    it('should return a new DiskFile object stored on disk', async () => {
      async function* streamCallback() {
        yield Buffer.from('callback content');
      }
      const fileContents = new FileContents(streamCallback);

      const diskContents = await fileIO.toDisk(fileContents);
      const diskFullPath = diskContents.path;

      expect(await readFile(diskFullPath, 'utf8')).toBe('callback content');
    });
  });

  describe('getReadable()', () => {
    it('should return a file contents asyncIterable', async () => {
      const callbackContent = 'multiple reads content';
      async function* streamCallback() {
        yield Buffer.from(callbackContent);
      }

      const fileContents = new FileContents(streamCallback);

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
      const fileContents = new FileContents(streamCallback);

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
      const fileContents = new FileContents(streamCallback);

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
      const fileContents = new FileContents(() => createThrowingIterator(errorMessage));

      await expect(async () =>
        (await fileIO.toBuffer(fileContents)).getDataOrThrow()
      ).rejects.toThrow(errorMessage);
    });

    it('should throw error when async callback rejects', async () => {
      const errorMessage = 'Async callback error';
      const fileContents = new FileContents(() => createThrowingIterator(errorMessage));

      await expect(async () =>
        (await fileIO.toBuffer(fileContents)).getDataOrThrow()
      ).rejects.toThrow(errorMessage);
    });
  });
});
