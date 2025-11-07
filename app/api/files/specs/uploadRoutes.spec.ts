import { Application, NextFunction, Request, Response } from 'express';
import path from 'path';
import request, { Response as SuperTestResponse } from 'supertest';

import entities from 'api/entities';
import { customUploadsPath, fileExistsOnPath } from 'api/files';
import { search } from 'api/search';
import { iosocket, setUpApp, socketEmit, TestEmitSources } from 'api/utils/testingRoutes';
import { FileType } from 'shared/types/fileType';

import { testingEnvironment } from 'api/utils/testingEnvironment';
import { testingTenants } from 'api/utils/testingTenants';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs/promises';
import { PathManager } from 'api/files.v2/infrastructure/PathManager';
import { tenants } from 'api/tenants';
import { UserSchema } from 'shared/types/userType';
import { files } from '../files';
import uploadRoutes from '../routes';
import { adminUser, collabUser, fixtures, importTemplate, templateId } from './fixtures';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

describe('upload routes', () => {
  let requestMockedUser: UserSchema = collabUser;

  const app: Application = setUpApp(
    uploadRoutes,
    (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = (() => requestMockedUser)();
      next();
    }
  );

  const mockCurrentUser = (user: UserSchema) => {
    requestMockedUser = user;
    testingEnvironment.setPermissions(user);
  };

  beforeAll(async () => {
    jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());
    jest.spyOn(Date, 'now').mockReturnValue(1000);
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  const uploadDocument = async (filepath: string): Promise<SuperTestResponse> =>
    request(app)
      .post('/api/files/upload/document')
      .field('entity', 'sharedId1')
      .attach('file', path.join(__dirname, filepath));

  describe.each([
    { title: 'POST /files/upload/documents V1', featureFlags: { v2UploadFile: false } },
    { title: 'POST /files/upload/documents V2', featureFlags: { v2UploadFile: true } },
  ])('$title', ({ featureFlags }) => {
    let pathManager: PathManager;
    beforeAll(async () => {
      await testingEnvironment.setUp(fixtures);
      testingTenants.changeCurrentTenant({
        featureFlags,
      });
      await testingEnvironment.cleanupUploadPaths();
      pathManager = new PathManager({ tenant: tenants.current() });
    });

    it('should upload the file', async () => {
      const response = await uploadDocument('testing_files/english_testing_file.pdf');
      expect(response).toHaveStatus(200);

      expect(response.body).toMatchObject({
        _id: expect.any(String),
        filename: expect.any(String),
        originalname: 'english_testing_file.pdf',
      });

      const { filename } = (await testingEnvironment.db.getAllFrom('files')).find(
        f => f.originalname === 'english_testing_file.pdf'
      ) as FileType;

      expect(
        await fileExistsOnPath(pathManager.createPath({ filename: filename!, type: 'document' }))
      ).toBe(true);
    });

    it('should process and reindex the document after upload', async () => {
      const res = await uploadDocument('testing_files/english_testing_file.pdf');
      expect(res).toHaveStatus(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          originalname: 'english_testing_file.pdf',
          // status: 'processing',
        })
      );

      expect(iosocket.emit).toHaveBeenCalledWith(
        'conversionStart',
        TestEmitSources.session,
        'sharedId1'
      );
      expect(iosocket.emit).toHaveBeenCalledWith(
        'documentProcessed',
        TestEmitSources.session,
        'sharedId1'
      );

      const upload = (await testingEnvironment.db.getAllFrom('files')).find(
        f => f.originalname === 'english_testing_file.pdf'
      ) as FileType;

      expect(upload).toMatchObject({
        entity: 'sharedId1',
        type: 'document',
        status: 'ready',
        fullText: {
          1: 'This[[1]] is[[1]] a[[1]] dumb[[1]] text[[1]] file[[1]] used[[1]] to[[1]] text[[1]] language[[1]] detecting,[[1]] it[[1]] should[[1]] be[[1]] detected[[1]] as[[1]] english[[1]]\n\n',
        },
        totalPages: 1,
        language: 'eng',
        filename: expect.stringMatching(/.*\.pdf/),
        originalname: 'english_testing_file.pdf',
        creationDate: 1000,
      });
    });

    it('should generate a thumbnail for the document', async () => {
      await uploadDocument('testing_files/english_testing_file.pdf');

      const dbFiles = await testingEnvironment.db.getAllFrom('files');
      const {
        filename = '',
        language,
        mimetype,
        size,
      } = dbFiles.find(f => f.type === 'thumbnail' && f.entity === 'sharedId1') as FileType;

      expect(language).toBe('eng');
      expect(mimetype).toEqual('image/jpeg');
      expect(size).toBe(2335);

      expect(await fileExistsOnPath(pathManager.createPath({ filename, type: 'thumbnail' }))).toBe(
        true
      );
    });

    describe('Language detection', () => {
      it('should detect English documents and store the result', async () => {
        await uploadDocument('testing_files/eng.pdf');

        const upload = (await testingEnvironment.db.getAllFrom('files')).find(
          f => f.originalname === 'eng.pdf'
        ) as FileType;
        expect(upload.language).toBe('eng');
      });

      it('should detect Spanish documents and store the result', async () => {
        await uploadDocument('testing_files/spn.pdf');

        const upload = (await testingEnvironment.db.getAllFrom('files')).find(
          f => f.originalname === 'spn.pdf'
        ) as FileType;
        expect(upload.language).toBe('spa');
      });
    });

    describe('when conversion fails', () => {
      it('should set document status to failed and emit a socket conversionFailed event with the id of the document', async () => {
        await socketEmit('conversionFailed', async () =>
          request(app)
            .post('/api/files/upload/document')
            .field('entity', 'sharedId1')
            .attach('file', path.join(__dirname, 'testing_files/invalid_document.txt'))
        );

        const upload = (await testingEnvironment.db.getAllFrom('files')).find(
          f => f.originalname === 'invalid_document.txt'
        ) as FileType;
        expect(upload.status).toBe('failed');
      });

      it('should return the file object', async () => {
        const response: SuperTestResponse = await request(app)
          .post('/api/files/upload/document')
          .field('entity', 'sharedId1')
          .attach('file', path.join(__dirname, 'testing_files/invalid_document.txt'));

        expect(response.body.status).toBe('failed');
        expect(response.body._id).toBeDefined();
        expect(response.body.originalname).toBe('invalid_document.txt');
      });
    });
  });

  describe('POST/files/upload/custom', () => {
    it('should save the upload and return it', async () => {
      const response: SuperTestResponse = await request(app)
        .post('/api/files/upload/custom')
        .attach('file', path.join(__dirname, 'test.txt'));

      expect(response.body).toEqual(
        expect.objectContaining({
          type: 'custom',
          filename: expect.stringMatching(/.*\.txt/),
          mimetype: 'text/plain',
          originalname: 'test.txt',
          size: 5,
        })
      );
    });

    it('should save the file on customUploads path', async () => {
      await request(app)
        .post('/api/files/upload/custom')
        .attach('file', path.join(__dirname, 'test.txt'));

      const [file]: FileType[] = await files.get({ originalname: 'test.txt' });

      expect(await fs.readFile(customUploadsPath(file.filename || ''))).toBeDefined();
    });
  });

  describe('POST /api/import', () => {
    it('should import the entried from the csv file', async () => {
      await socketEmit('IMPORT_CSV_END', async () =>
        request(app)
          .post('/api/import')
          .field('template', importTemplate.toString())
          .attach('file', `${__dirname}/testing_files/importcsv.csv`)
      );

      expect(iosocket.emit).toHaveBeenCalledWith('IMPORT_CSV_START', TestEmitSources.session);
      expect(iosocket.emit).toHaveBeenCalledWith('IMPORT_CSV_PROGRESS', TestEmitSources.session, 1);
      expect(iosocket.emit).toHaveBeenCalledWith('IMPORT_CSV_PROGRESS', TestEmitSources.session, 2);

      const imported = await entities.get({ template: importTemplate });
      expect(imported).toEqual([
        expect.objectContaining({ title: 'imported entity one' }),
        expect.objectContaining({ title: 'imported entity two' }),
      ]);
    });

    it('should emit IMPORT_CSV_ROW_EXCEPTIONS when there are import warnings', async () => {
      const csvWithWarnings = `title,select_with_spaces,text_label
imported entity one, " Item2 ", "text with   multiple   spaces"
imported entity two, "Normal Item", "normal text"
imported entity three, "  Only spaces"
imported entity four, "Invalid::Thesaurus::Value, ext with\nnewlines"`;

      const tempCsvPath = `${__dirname}/testing_files/temp_import_with_warnings.csv`;
      await fs.writeFile(tempCsvPath, csvWithWarnings);

      try {
        await socketEmit('IMPORT_CSV_END', async () =>
          request(app)
            .post('/api/import')
            .field('template', importTemplate.toString())
            .attach('file', tempCsvPath)
        );

        expect(iosocket.emit).toHaveBeenCalledWith('IMPORT_CSV_START', TestEmitSources.session);
        expect(iosocket.emit).toHaveBeenCalledWith(
          'IMPORT_CSV_ROW_EXCEPTIONS',
          TestEmitSources.session,
          expect.objectContaining({
            'Sanitized entries skipped in import': expect.arrayContaining([
              expect.objectContaining({
                index: expect.any(Number),
                property: expect.any(String),
                reason: expect.any(String),
                value: expect.any(String),
              }),
            ]),
          })
        );

        const imported = await entities.get({ template: importTemplate });
        expect(imported.length).toBeGreaterThan(0);
      } finally {
        await fs.unlink(tempCsvPath).catch(() => {});
      }
    });

    describe('on error', () => {
      it('should emit the error', async () => {
        await socketEmit('IMPORT_CSV_ERROR', async () =>
          request(app)
            .post('/api/import')
            .field('template', templateId.toString())
            .attach('file', `${__dirname}/testing_files/import.zip`)
        );

        expect(iosocket.emit).toHaveBeenCalledWith(
          'IMPORT_CSV_ERROR',
          TestEmitSources.session,
          expect.objectContaining({ code: 500 })
        );
      });
    });
  });

  describe('DELETE/files', () => {
    it('should delete thumbnails asociated with documents deleted', async () => {
      mockCurrentUser(adminUser);
      await uploadDocument('testing_files/english_testing_file.pdf');

      const [file]: FileType[] = await files.get({
        originalname: 'english_testing_file.pdf',
      });

      await request(app).delete('/api/files').query({ _id: file._id?.toString() });

      const [thumbnail]: FileType[] = await files.get({ filename: `${file._id}.jpg` });
      expect(thumbnail).not.toBeDefined();
    });
  });
});
