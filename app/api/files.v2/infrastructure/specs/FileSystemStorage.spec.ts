/* eslint-disable node/no-restricted-import */
import * as fs from 'fs/promises';

import { File } from 'api/files.v2/model/File';
import { FileType } from 'api/files.v2/model/FileType';
import { Tenant, tenants } from 'api/tenants/tenantContext';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { createReadStream } from 'fs';
import path from 'path';
import { FileSystemStorage } from '../FileSystemStorage';
import { PathManager } from '../PathManager';

const createFileContent = (text: string) => `This is a test file content ${text}`;
const createFileName = (fileType: FileType) => `TestFileSystemStorage${fileType}.txt`;

describe('FileSystemStorage', () => {
  let fileSystemStorage: FileSystemStorage;
  let tenant: Tenant;
  let pathManager: PathManager;

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
  });

  afterAll(async () => {
    await testingEnvironment.cleanupUploadPaths();
  });

  describe('getFile', () => {
    it('should return a File for the given file input', async () => {
      const promises = pathManager.directories.map(async directory => {
        const file = await fileSystemStorage.getFile({
          filename: createFileName(directory.name),
          type: directory.name,
        });

        const content = await file.asContentString();

        expect(content).toBe(createFileContent(directory.name));
      });

      await Promise.all(promises);
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
        expect(content).toBe(createFileContent(pathManager.directories[index].name));
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
        file: new File({
          source: createReadStream(testingFilesPath('documento.txt')),
          filename: 'file_created.txt',
        }),
        type: 'document',
      });

      const file = new File({
        source: createReadStream(
          pathManager.createPath({ filename: 'file_created.txt', type: 'document' })
        ),
        filename: 'file_created.txt',
      });
      expect(await file.asContentString()).toBe('content created\n');
    });

    describe('when type is segmentation', () => {
      it('should store it on a segmentation folder inside documents path', async () => {
        await fileSystemStorage.storeFile({
          file: new File({
            source: createReadStream(testingFilesPath('documento.txt')),
            filename: 'file_created.txt',
          }),
          type: 'segmentation',
        });

        const file = new File({
          source: createReadStream(
            pathManager.createPath({ filename: 'file_created.txt', type: 'document' })
          ),
          filename: 'file_created.txt',
        });
        expect(await file.asContentString()).toBe('content created\n');
      });
    });
  });
});
