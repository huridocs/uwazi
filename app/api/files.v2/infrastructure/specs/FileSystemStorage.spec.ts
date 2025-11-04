/* eslint-disable node/no-restricted-import */
import * as fs from 'fs/promises';

import { FileContents } from 'api/files.v2/model/FileContents';
import { Tenant, tenants } from 'api/tenants/tenantContext';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { createReadStream } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { FileSystemStorage } from '../FileSystemStorage';
import { PathManager } from '../PathManager';

const createFileContent = (text: string) => `This is a test file content ${text}`;
const createFileName = (fileType: string) => `TestFileSystemStorage${fileType}.txt`;

describe('FileSystemStorage', () => {
  let fileSystemStorage: FileSystemStorage;
  let tenant: Tenant;
  let pathManager: PathManager;

  const toString = async (file: Readable) => {
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const _buf: Buffer[] = [];
      file.on('data', (chunk: any) => _buf.push(chunk));
      file.on('end', () => resolve(Buffer.concat(_buf)));
      file.on('error', (err: unknown) => reject(err));
    });
    return buffer.toString('utf8');
  };

  beforeAll(async () => {
    await testingEnvironment.setTenant('testTenant');
    tenant = tenants.current();
    pathManager = new PathManager({ tenant });
    fileSystemStorage = new FileSystemStorage(pathManager);

    const promises = pathManager.directories.map(async directory =>
      fs.writeFile(
        pathManager.createPath({
          filename: createFileName(directory.name),
          type: directory.name,
        }),
        createFileContent(directory.name)
      )
    );

    await Promise.all(promises);

    const customPath = pathManager.createPath({
      filename: createFileName('customPath'),
      type: 'customPath',
      destination: 'custom/path',
    });
    await fs.mkdir(path.dirname(customPath), { recursive: true });
    await fs.writeFile(customPath, createFileContent('customPath'));
  });

  afterAll(async () => {
    await testingEnvironment.cleanupUploadPaths();
    await fs.rm(
      pathManager.createPath({
        filename: createFileName('customPath'),
        type: 'customPath',
        destination: 'custom/path',
      })
    );
  });

  describe('getFile', () => {
    it('should return a File for the given file input', async () => {
      const promises = pathManager.directories.map(async directory => {
        const file = await fileSystemStorage.getFile({
          filename: createFileName(directory.name),
          type: directory.name,
        });

        const content = await file.asContentString();

        expect(content.getDataOrThrow()).toBe(createFileContent(directory.name));
      });

      await Promise.all(promises);
    });

    it('should return a customPath file', async () => {
      const file = await fileSystemStorage.getFile({
        filename: createFileName('customPath'),
        type: 'customPath',
        destination: 'custom/path',
      });

      const content = await file.asContentString();

      expect(content.getDataOrThrow()).toBe(createFileContent('customPath'));
    });
  });

  describe('getFiles', () => {
    it('should return an array of Files for the given file inputs', async () => {
      const inputs = pathManager.directories.map(directory => ({
        filename: createFileName(directory.name),
        type: directory.name,
      }));

      const files = await fileSystemStorage.getFiles(inputs);

      const promises = files.map(async (file, index) => {
        const content = await file.asContentString();
        expect(content.getDataOrThrow()).toBe(
          createFileContent(pathManager.directories[index].name)
        );
      });

      await Promise.all(promises);
    });

    it('should return an empty array if no inputs are provided', async () => {
      const files = await fileSystemStorage.getFiles([]);
      expect(files).toEqual([]);
    });

    it('should throw an error if any of the files do not exist', async () => {
      const inputs = [
        ...pathManager.directories.map(directory => ({
          filename: createFileName(directory.name),
          type: directory.name,
        })),
        { filename: 'NonExistentFile.txt', type: 'nonexistent' as any },
      ];

      await expect(fileSystemStorage.getFiles(inputs)).rejects.toThrow();
    });
  });

  describe('storeFile', () => {
    const testingFilesPath = (filename: string) =>
      path.join(__dirname, '../../../files/specs/testing_files', filename);

    it('should store it on the disk', async () => {
      await fileSystemStorage.storeFile({
        file: new FileContents(testingFilesPath('documento.txt')),
        type: 'document',
      });

      const contents = await toString(
        createReadStream(pathManager.createPath({ filename: 'documento.txt', type: 'document' }))
      );
      expect(contents).toBe('content created\n');
    });

    describe('when type is segmentation', () => {
      it('should store it on a segmentation folder inside documents path', async () => {
        await fileSystemStorage.storeFile({
          file: new FileContents(testingFilesPath('documento.txt')),
          type: 'segmentation',
        });

        const contents = await toString(
          createReadStream(pathManager.createPath({ filename: 'documento.txt', type: 'document' }))
        );
        expect(contents).toBe('content created\n');
      });
    });

    describe('when type is customPath', () => {
      it('should store it on the destination', async () => {
        await fileSystemStorage.storeFile({
          file: new FileContents(testingFilesPath('documento.txt')),
          destination: 'custom_path/deep/',
          type: 'customPath',
        });

        const contents = await toString(
          createReadStream(
            path.join(
              path.dirname(tenants.current().uploadedDocuments),
              'custom_path/deep/documento.txt'
            )
          )
        );
        expect(contents).toBe('content created\n');
      });
    });
  });
});
