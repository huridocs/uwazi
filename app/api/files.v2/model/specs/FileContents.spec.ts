// eslint-disable-next-line node/no-restricted-import
import { existsSync, mkdirSync, writeFileSync } from 'fs';
// eslint-disable-next-line node/no-restricted-import
import { readFile, unlink } from 'fs/promises';

import { tmpdir } from 'os';
import path from 'path';
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

  describe('Disk', () => {
    describe('constructor', () => {
      it('should create a FileContents instance with filename and filepath', () => {
        const file = new FileContents(testFilePath);

        expect(file.filename).toBe('test-file.txt');
        expect(file.getFullPath().getDataOrThrow()).toBe(testFilePath);
      });
    });

    describe('read', () => {
      it('should return async iterable with correct content', async () => {
        const file = new FileContents(testFilePath);

        let outputContent = '';
        for await (const chunk of file.read()) {
          outputContent += chunk;
        }
        expect(outputContent).toBe(testContent);
      });
    });

    describe('getFullPath', () => {
      it('should return the resolved full path', () => {
        const file = new FileContents(testFilePath);

        const fullPath = file.getFullPath();
        expect(fullPath.getDataOrThrow()).toBe(path.resolve(testFilePath));
      });
    });
  });

  describe('Callback based', () => {
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

    describe('read()', () => {
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

    describe('getFullPath()', () => {
      it('should return undefined for  FileContents', () => {
        async function* streamCallback() {
          yield Buffer.from('content');
        }
        const fileContents = new FileContents({
          filename: 'callback-file.txt',
          streamCallback,
        });

        expect(() => fileContents.getFullPath().getDataOrThrow()).toThrow();
      });
    });
  });
});
