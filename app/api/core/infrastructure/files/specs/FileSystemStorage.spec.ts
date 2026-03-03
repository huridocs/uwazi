/* eslint-disable node/no-restricted-import */
import * as fs from 'fs/promises';

import { FileBuilder } from '#api/core/domain/files/specs/FileBuilder.js';
import { FileContentsIO } from '#api/core/infrastructure/files/FileContentIO.js';
import { fileExistsOnPath } from '#api/files/index.js';
import { Tenant, tenants } from '#api/tenants/tenantContext.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { createReadStream } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { FileSystemStorage } from '../FileSystemStorage.js';
import { PathManager } from '../PathManager.js';

const createFileContent = (text: string) => `This is a test file content ${text}`;
const createFileName = (fileType: string) => `TestFileSystemStorage${fileType}.txt`;

const f = getFixturesFactory();

describe('FileSystemStorage', () => {
  let fileSystemStorage: FileSystemStorage;
  let tenant: Tenant;
  let pathManager: PathManager;
  const fileIO = new FileContentsIO();

  const toString = async (file: Readable) => {
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const _buf: Uint8Array[] = [];
      file.on('data', (chunk: Uint8Array) => _buf.push(new Uint8Array(chunk)));
      file.on('end', () => resolve(Buffer.concat(_buf)));
      file.on('error', (err: unknown) => reject(err));
    });
    return buffer.toString('utf8');
  };

  beforeAll(async () => {
    await testingEnvironment.setTenant();
    await testingEnvironment.setupTenantTmpPaths([]);
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

  describe('getFile', () => {
    it('should return a File for the given file input', async () => {
      const promises = pathManager.directories.map(async directory => {
        const file = await fileSystemStorage.getFile({
          filename: createFileName(directory.name),
          type: directory.name,
        });

        const content = await fileIO.asContentString(file);

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

      const content = await fileIO.asContentString(file);

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
        const content = await fileIO.asContentString(file);
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
    it('should store it on the disk', async () => {
      const document = FileBuilder.document(f.idString('doc'), {
        content: FileBuilder.content('content created\n'),
        filename: 'document.txt',
      });

      await fileSystemStorage.storeFile(document);
      const contents = await toString(createReadStream(pathManager.createPath(document)));
      expect(contents).toBe('content created\n');
    });

    // describe('when type is segmentation', () => {
    //   it('should store it on a segmentation folder inside documents path', async () => {
    //     await fileSystemStorage.storeFile({
    //       file: new DiskFile(testingFilesPath('documento.txt')).toContent(),
    //       type: 'segmentation',
    //     });
    //
    //     const contents = await toString(
    //       createReadStream(pathManager.createPath({ filename: 'documento.txt', type: 'document' }))
    //     );
    //     expect(contents).toBe('content created\n');
    //   });
    // });
  });

  describe('removeContent', () => {
    it('should delete content from disk', async () => {
      const document = FileBuilder.document(f.idString('document'), {
        content: FileBuilder.content('content created\n'),
        filename: 'documento.txt',
      });

      await fileSystemStorage.storeFile(document);
      await fileSystemStorage.removeContent(pathManager.createPath(document));

      expect(await fileExistsOnPath(pathManager.createPath(document))).toBe(false);
    });
  });

  describe('removeFile', () => {
    it('should delete the file on disk', async () => {
      const document = FileBuilder.document(f.idString('document'), {
        content: FileBuilder.content('content created\n'),
        filename: 'documento.txt',
      });

      await fileSystemStorage.storeFile(document);
      await fileSystemStorage.removeFile(document);

      expect(await fileExistsOnPath(pathManager.createPath(document))).toBe(false);
    });
  });

  describe('storeContent', () => {
    it('should store it on the destination', async () => {
      await fileSystemStorage.storeContent(
        FileBuilder.content('content created\n'),
        'custom_path/deep/documento.txt'
      );

      const contents = await toString(
        createReadStream(
          path.join(tenants.current().uploadedDocuments, 'custom_path/deep/documento.txt')
        )
      );
      expect(contents).toBe('content created\n');
    });
  });

  describe('fileExists', () => {
    it('should check if file exists', async () => {
      const doc = FileBuilder.document('docId', {
        content: FileBuilder.content('content created\n'),
      });

      expect(await fileSystemStorage.fileExists(doc)).toBe(false);

      await fileSystemStorage.storeFile(doc);

      expect(await fileSystemStorage.fileExists(doc)).toBe(true);
    });
  });
});
