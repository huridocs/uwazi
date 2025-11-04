// eslint-disable-next-line node/no-restricted-import
import { createWriteStream, existsSync, mkdirSync, writeFileSync } from 'fs';
// eslint-disable-next-line node/no-restricted-import
import { readFile, unlink } from 'fs/promises';

import { tmpdir } from 'os';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { FileContents } from '../FileContents';

describe('FileContents', () => {
  const testDir = path.join(tmpdir(), 'fileContents-tests');
  const testFilePath = path.join(testDir, 'test-file.txt');
  const testContent = 'Hello, World! This is a test file content.';

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

  describe('constructor', () => {
    it('should create a FileContents instance with filename and filepath', () => {
      const file = new FileContents(testFilePath);

      expect(file.filename).toBe('test-file.txt');
      expect(file.getFullPath().getDataOrThrow()).toBe(testFilePath);
    });
  });

  describe('getReadable', () => {
    it('should return a readable stream', async () => {
      const file = new FileContents(testFilePath);

      const readable = await file.getReadable();
      expect(readable.getDataOrThrow()).toBeInstanceOf(Readable);
    });

    it('should return readable stream with correct content', async () => {
      const file = new FileContents(testFilePath);

      const readable = await file.getReadable();
      const outputPath = path.join(testDir, 'output.txt');

      await pipeline(readable.getDataOrThrow(), createWriteStream(outputPath));
      const outputContent = await readFile(outputPath, 'utf8');

      expect(outputContent).toBe(testContent);

      await unlink(outputPath);
    });
  });

  describe('toBuffer', () => {
    it('should return file content as buffer', async () => {
      const file = new FileContents(testFilePath);

      const buffer = (await file.toBuffer()).getDataOrThrow();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString('utf8')).toBe(testContent);
    });
  });

  describe('asContentString', () => {
    it('should return file content as string', async () => {
      const file = new FileContents(testFilePath);

      const content = (await file.asContentString()).getDataOrThrow();
      expect(content).toBe(testContent);
      expect(typeof content).toBe('string');
    });
  });

  describe('getFullPath', () => {
    it('should return the resolved full path', () => {
      const file = new FileContents(testFilePath);

      const fullPath = file.getFullPath();
      expect(fullPath.getDataOrThrow()).toBe(path.resolve(testFilePath));
    });
  });

  describe('callback-based constructor', () => {
    it('should create FileContents with callback object', () => {
      const mockCallback = jest.fn(async () => Readable.from(['callback content']));
      const fileContents = new FileContents({
        filename: 'callback-file.txt',
        readableCallback: mockCallback,
      });

      expect(fileContents.filename).toBe('callback-file.txt');
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('callback-based getReadable()', () => {
    it('should return readable stream from callback', async () => {
      const callbackContent = 'callback stream content';
      const mockCallback = jest.fn(async () => Readable.from([callbackContent]));
      const fileContents = new FileContents({
        filename: 'callback-stream.txt',
        readableCallback: mockCallback,
      });

      const readable = await fileContents.getReadable();

      expect(readable.getDataOrThrow()).toBeInstanceOf(Readable);
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should allow multiple reads from callback', async () => {
      const callbackContent = 'multiple reads content';
      const fileContents = new FileContents({
        filename: 'multiple-reads.txt',
        readableCallback: async () => Readable.from([callbackContent]),
      });

      const content1 = await fileContents.asContentString();
      const content2 = await fileContents.asContentString();

      expect(content1.getDataOrThrow()).toBe(callbackContent);
      expect(content2.getDataOrThrow()).toBe(callbackContent);
    });
  });

  describe('callback-based toBuffer()', () => {
    it('should return buffer from callback', async () => {
      const callbackContent = 'async callback buffer content';
      const fileContents = new FileContents({
        filename: 'async-callback-buffer.txt',
        readableCallback: async () => Readable.from([callbackContent]),
      });

      const buffer = (await fileContents.toBuffer()).getDataOrThrow();

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString('utf8')).toBe(callbackContent);
    });
  });

  describe('callback-based asContentString()', () => {
    it('should return string content from callback', async () => {
      const callbackContent = 'callback string content';
      const fileContents = new FileContents({
        filename: 'callback-string.txt',
        readableCallback: async () => Readable.from([callbackContent]),
      });

      const content = (await fileContents.asContentString()).getDataOrThrow();

      expect(typeof content).toBe('string');
      expect(content).toBe(callbackContent);
    });
  });

  describe('callback-based getFullPath()', () => {
    it('should return undefined for callback-based FileContents', () => {
      const fileContents = new FileContents({
        filename: 'callback-file.txt',
        readableCallback: async () => Readable.from(['content']),
      });

      expect(() => fileContents.getFullPath().getDataOrThrow()).toThrow();
    });
  });

  describe('callback error handling', () => {
    it('should throw error when callback throws', async () => {
      const errorMessage = 'Callback error';
      const fileContents = new FileContents({
        filename: 'error-callback.txt',
        readableCallback: () => {
          throw new Error(errorMessage);
        },
      });

      await expect(fileContents.toBuffer()).rejects.toThrow(errorMessage);
    });

    it('should throw error when async callback rejects', async () => {
      const errorMessage = 'Async callback error';
      const fileContents = new FileContents({
        filename: 'async-error-callback.txt',
        readableCallback: async () => {
          throw new Error(errorMessage);
        },
      });

      await expect(fileContents.toBuffer()).rejects.toThrow(errorMessage);
    });
  });
});
