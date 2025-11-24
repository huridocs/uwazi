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

  describe('constructor', () => {
    it('should create FileContents with callback object', () => {
      const streamCallback = jest.fn(async function* streamCallback() {
        yield Buffer.from('callback content');
      });

      // eslint-disable-next-line no-new
      new FileContents(streamCallback);

      expect(streamCallback).not.toHaveBeenCalled();
    });
  });

  describe('read()', () => {
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
});
