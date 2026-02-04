import { InputFile } from 'api/core/infrastructure/files/InputFile';
import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';

import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import { FileContentsIO } from 'api/core/infrastructure/files/FileContentIO';
import { generateFileName } from 'api/files';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { UploadMiddleware } from '../UploadMiddleware';

const fileIO = new FileContentsIO();

const uploadFile = async (options?: {
  originalName?: string;
  nameGenerator?: typeof generateFileName;
}) => {
  let req!: Request;
  const app = express();
  app.post(
    '/test/single_upload',
    new UploadMiddleware(LoggerFactory.fake(), options?.nameGenerator).singleUpload('document'),
    (_req, _res, next) => {
      req = _req;
      next();
    }
  );

  let error: Error | null = null;

  app.use((_error: Error, _req: Request, _res: Response, next: NextFunction) => {
    error = _error;
    next();
  });

  await request(app)
    .post('/test/single_upload')
    .field('originalname', options?.originalName || '')
    .attach('file', Buffer.from('contenido documento'), 'documento.txt');

  return { req, error };
};

describe('uploadFilesMiddleware', () => {
  describe('Single upload', () => {
    let inputFile: InputFile;
    beforeAll(async () => {
      await testingEnvironment.setTenant();
      const { req } = await uploadFile();
      inputFile = req.inputFile as InputFile;
    });

    it('should set req.inputFile to be an InputFile instance', async () => {
      expect(inputFile).toBeInstanceOf(InputFile);
    });

    it('should preserve the originalname (deprecated)', async () => {
      expect(inputFile.metadata).toMatchObject({
        originalname: 'documento.txt',
      });
    });

    it('should use the originalname in the body if present', async () => {
      const { req } = await uploadFile({ originalName: 'newName.txt' });
      inputFile = req.inputFile as InputFile;

      expect(inputFile.metadata).toMatchObject({
        originalname: 'newName.txt',
      });
    });

    it('should tag inputFile with the type passed', async () => {
      expect(inputFile.isDocument()).toBe(true);
    });

    it('should upload to tmp directory and attach to req.inputFile an InputFile', async () => {
      expect(inputFile.filepath.match(/tmp/)).toBeTruthy();
      expect((await fileIO.asContentString(inputFile.content)).getDataOrThrow()).toContain(
        'contenido documento'
      );
    });

    describe('on error', () => {
      it('should propagate the error to the next error handling middleware', async () => {
        const { error } = await uploadFile({
          nameGenerator: () => {
            throw new Error('name generation error');
          },
        });

        expect(error).toEqual(new Error('name generation error'));
      });
    });
  });

  describe('Multiple uploads', () => {
    const uploadFiles = async (options?: {
      attachNames?: boolean;
      nameGenerator?: typeof generateFileName;
    }) => {
      let req!: Request;
      const app = express();
      app.post(
        '/test/multiple_uploads',
        new UploadMiddleware(LoggerFactory.fake(), options?.nameGenerator).multiple(),
        (_req, _res, next) => {
          req = _req;
          next();
        }
      );

      let error: Error | null = null;

      app.use((_error: Error, _req: Request, _res: Response, next: NextFunction) => {
        error = _error;
        next();
      });

      const uploadRequest = request(app)
        .post('/test/multiple_uploads')
        .attach('documents[0]', Buffer.from('document content 0'), 'document_0.txt')
        .attach('documents[1]', Buffer.from('document content 1'), 'document_1.txt')
        .attach('attachments[0]', Buffer.from('attachment content 0'), 'attachment_0.txt')
        .attach('attachments[1]', Buffer.from('attachment content 1'), 'attachment_1.txt');

      if (options?.attachNames) {
        uploadRequest
          .field('documents_originalname[0]', 'document_original_name_0.txt')
          .field('documents_originalname[1]', 'document_original_name_1.txt')
          .field('attachments_originalname[0]', 'attachment_original_name_0.txt')
          .field('attachments_originalname[1]', 'attachment_original_name_1.txt');
      }

      await uploadRequest;

      return { req, error };
    };

    let inputFiles: InputFile[];
    beforeAll(async () => {
      await testingEnvironment.setTenant();
      const { req } = await uploadFiles();
      inputFiles = req.inputFiles as InputFile[];
    });

    it('should set req.inputFiles to be an array of InputFiles', async () => {
      expect(inputFiles.length).toBe(4);
      expect(inputFiles[0]).toBeInstanceOf(InputFile);
      expect(inputFiles[1]).toBeInstanceOf(InputFile);
      expect(inputFiles[2]).toBeInstanceOf(InputFile);
      expect(inputFiles[3]).toBeInstanceOf(InputFile);
    });

    it('should preserve the originalname (deprecated)', async () => {
      expect(inputFiles[0].metadata).toMatchObject({
        originalname: 'document_0.txt',
      });
      expect(inputFiles[1].metadata).toMatchObject({
        originalname: 'document_1.txt',
      });
      expect(inputFiles[2].metadata).toMatchObject({
        originalname: 'attachment_0.txt',
      });
      expect(inputFiles[3].metadata).toMatchObject({
        originalname: 'attachment_1.txt',
      });
    });

    it('should use the originalname in the body if present', async () => {
      const { req } = await uploadFiles({ attachNames: true });
      inputFiles = req.inputFiles as InputFile[];

      expect(inputFiles[0].metadata).toMatchObject({
        originalname: 'document_original_name_0.txt',
      });
      expect(inputFiles[1].metadata).toMatchObject({
        originalname: 'document_original_name_1.txt',
      });
      expect(inputFiles[2].metadata).toMatchObject({
        originalname: 'attachment_original_name_0.txt',
      });
      expect(inputFiles[3].metadata).toMatchObject({
        originalname: 'attachment_original_name_1.txt',
      });
    });

    it('should log a deprecation warning when originalname fields are not provided in body', async () => {
      const mockLogger = LoggerFactory.fake();
      jest.spyOn(mockLogger, 'debug');

      const app = express();
      app.post(
        '/test/deprecation',
        new UploadMiddleware(mockLogger).multiple(),
        (_req, _res, next) => {
          next();
        }
      );

      await request(app)
        .post('/test/deprecation')
        .attach('documents[0]', Buffer.from('content'), 'file.txt');

      expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('Deprecation warning'));
    });

    it('should tag inputFile with the proper type (attachment or document)', async () => {
      expect(inputFiles[0].isDocument()).toBe(true);
      expect(inputFiles[1].isDocument()).toBe(true);
      expect(inputFiles[2].isAttachment()).toBe(true);
      expect(inputFiles[3].isAttachment()).toBe(true);
    });

    it('should upload to tmp directory and attach to req.inputFile an InputFile', async () => {
      expect(inputFiles[0].filepath.match(/tmp/)).toBeTruthy();
      expect(inputFiles[1].filepath.match(/tmp/)).toBeTruthy();
      expect(inputFiles[2].filepath.match(/tmp/)).toBeTruthy();
      expect(inputFiles[3].filepath.match(/tmp/)).toBeTruthy();

      expect((await fileIO.asContentString(inputFiles[0].content)).getDataOrThrow()).toContain(
        'document content 0'
      );
      expect((await fileIO.asContentString(inputFiles[1].content)).getDataOrThrow()).toContain(
        'document content 1'
      );
      expect((await fileIO.asContentString(inputFiles[2].content)).getDataOrThrow()).toContain(
        'attachment content 0'
      );
      expect((await fileIO.asContentString(inputFiles[3].content)).getDataOrThrow()).toContain(
        'attachment content 1'
      );
    });

    describe('on error', () => {
      it('should propagate the error to the next error handling middleware', async () => {
        const { error } = await uploadFiles({
          nameGenerator: () => {
            throw new Error('name generation error');
          },
        });

        expect(error).toEqual(new Error('name generation error'));
      });
    });
  });
});
