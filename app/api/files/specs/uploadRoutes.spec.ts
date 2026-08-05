/* eslint-disable max-statements */
import type { Application, NextFunction, Request, Response } from 'express';
import path from 'path';
import request, { Response as SuperTestResponse } from 'supertest';

import { fileExistsOnPath } from '#api/files/index.js';
import { search } from '#api/search/index.js';
import { iosocket, setUpApp, socketEmit, TestEmitSources } from '#api/utils/testingRoutes.js';
import { FileType } from '#shared/types/fileType.js';

import { PathManager } from '#api/core/infrastructure/files/PathManager.js';
import { toEmitEventWith } from '#api/core/libs/eventsbus/eventTesting.js';
import { csvImportRoutes } from '#api/csv.v2/infrastructure/http/routes.js';
import { tenants } from '#api/tenants/index.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { UserSchema } from '#shared/types/userType.js';
import { FileCreatedEvent } from '../events/FileCreatedEvent.js';
import { files } from '../files.js';
import uploadRoutes from '../routes.js';
import { adminUser, collabUser, fixtures } from './fixtures.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';

jest.mock(
  '../../auth/authMiddleware.ts',
  () => () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
);

expect.extend({ toEmitEventWith });

describe('upload routes', () => {
  let requestMockedUser: UserSchema = collabUser;

  const app: Application = setUpApp(
    uploadRoutes,
    (req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = (() => requestMockedUser)();
      next();
    }
  );

  csvImportRoutes(app);

  const mockCurrentUser = (user: UserSchema) => {
    requestMockedUser = user;
    testingEnvironment.setPermissions(user);
  };

  beforeAll(async () => {
    jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());
    jest.spyOn(Date, 'now').mockReturnValue(1000);
    jest.spyOn(EventEmitterFactory, 'default').mockReturnValue(EventEmitterFactory.forTesting());
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  const uploadDocument = async (filepath: string): Promise<SuperTestResponse> =>
    request(app)
      .post('/api/files/upload/document')
      .field('entity', 'sharedId1')
      .attach('file', path.join(__dirname, filepath));

  describe('POST /files/upload/attachment', () => {
    it('should save file on the body', async () => {
      const entityId = 'sharedId2';
      await request(app)
        .post('/api/files/upload/attachment')
        .field('entity', entityId.toString())
        .attach('file', Buffer.from('attachment content'), 'Dont bring me down - 1979')
        .expect(200);

      const [attachment] = await files.get({ entity: entityId.toString() });
      expect(attachment).toEqual(
        expect.objectContaining({
          originalname: 'Dont bring me down - 1979',
          type: 'attachment',
        })
      );
    });

    it.each(['Hello, World.pdf', 'Aló mundo.pdf', 'Привет, мир.pdf', '헬로월드.pdf'])(
      'should accept the filename %s in a field',
      async filename => {
        const res = await request(app)
          .post('/api/files/upload/attachment')
          .field('entity', 'sharedId2')
          .field('originalname', filename)
          .attach('file', path.join(__dirname, filename));

        expect(res).toHaveStatus(200);
        const [file]: FileType[] = await files.get({
          originalname: filename,
          type: 'attachment',
        });
        expect(file).not.toBe(undefined);
      }
    );
  });

  describe('POST /files/upload/documents', () => {
    let pathManager: PathManager;
    beforeAll(async () => {
      await testingEnvironment.setUp(fixtures);
      await testingEnvironment.cleanupUploadPaths();
      pathManager = new PathManager({ tenant: tenants.current() });
    });

    it.each(['Hello, World.pdf', 'Aló mundo.pdf', 'Привет, мир.pdf', '헬로월드.pdf'])(
      'should accept the filename %s in a field',
      async filename => {
        const res = await socketEmit('documentProcessed', async () =>
          request(app)
            .post('/api/files/upload/document')
            .field('originalname', filename)
            .field('entity', 'sharedId1')
            .attach('file', path.join(__dirname, filename))
        );

        expect(res).toHaveStatus(200);
        const [file]: FileType[] = await files.get({
          originalname: filename,
          type: 'document',
        });
        expect(file).not.toBe(undefined);
      }
    );

    it('should throw error if entity does not exist', async () => {
      const response = await request(app)
        .post('/api/files/upload/document')
        .field('entity', 'non_existent_shared_id')
        .attach('file', path.join(__dirname, 'testing_files/english_testing_file.pdf'));

      expect(response).toHaveStatus(422);
    });

    it('should upload the file', async () => {
      const response = await socketEmit('documentProcessed', async () =>
        uploadDocument('testing_files/english_testing_file.pdf')
      );
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

    it(`should emit a ${FileCreatedEvent.name} if a new file has been saved`, async () => {
      const caller = async () =>
        socketEmit('documentProcessed', async () =>
          uploadDocument('testing_files/english_testing_file.pdf')
        );

      await expect(caller).toEmitEventWith(FileCreatedEvent, {
        newFile: {
          entity: 'sharedId1',
          type: 'document',
          originalname: 'english_testing_file.pdf',
        },
      });
    });

    it('should process and reindex the document after upload', async () => {
      const res = await socketEmit('documentProcessed', async () =>
        uploadDocument('testing_files/english_testing_file.pdf')
      );

      expect(res).toHaveStatus(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          originalname: 'english_testing_file.pdf',
          status: 'processing',
        })
      );

      expect(iosocket.emit).toHaveBeenCalledWith(
        'conversionStart',
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
      await socketEmit('documentProcessed', async () =>
        uploadDocument('testing_files/english_testing_file.pdf')
      );

      const dbFiles = await testingEnvironment.db.getAllFrom('files');
      const file = dbFiles.find(f => f.originalname === 'english_testing_file.pdf');
      const {
        filename = '',
        language,
        mimetype,
        size,
      } = dbFiles.find(f => f.filename?.match(file?._id.toString())) as FileType;

      expect(language).toBe('eng');
      expect(mimetype).toEqual('image/jpeg');
      expect(size).toBe(2335);

      expect(await fileExistsOnPath(pathManager.createPath({ filename, type: 'thumbnail' }))).toBe(
        true
      );
    });

    describe('Language detection', () => {
      it('should detect English documents and store the result', async () => {
        await socketEmit('documentProcessed', async () => uploadDocument('testing_files/eng.pdf'));

        const upload = (await testingEnvironment.db.getAllFrom('files')).find(
          f => f.originalname === 'eng.pdf'
        ) as FileType;
        expect(upload.language).toBe('eng');
      });

      it('should detect Spanish documents and store the result', async () => {
        await socketEmit('documentProcessed', async () => uploadDocument('testing_files/spn.pdf'));

        const upload = (await testingEnvironment.db.getAllFrom('files')).find(
          f => f.originalname === 'spn.pdf'
        ) as FileType;
        expect(upload.language).toBe('spa');
      });
    });

    describe('when conversion fails', () => {
      it('should set document status to failed and emit a socket conversionFailed event with the id of the document', async () => {
        try {
          await socketEmit('conversionFailed', async () =>
            request(app)
              .post('/api/files/upload/document')
              .field('entity', 'sharedId1')
              .attach('file', path.join(__dirname, 'testing_files/invalid_document.txt'))
          );
        } catch (e) {
          if (!e.message.match('Failed PostProcess')) {
            throw e;
          }
        }

        const upload = (await testingEnvironment.db.getAllFrom('files')).find(
          f => f.originalname === 'invalid_document.txt'
        ) as FileType;
        expect(upload.status).toBe('failed');
      });

      it('should emit conversionFailed with the sharedId of the entity', async () => {
        try {
          await socketEmit('conversionFailed', async () =>
            request(app)
              .post('/api/files/upload/document')
              .field('entity', 'sharedId1')
              .attach('file', path.join(__dirname, 'testing_files/invalid_document.txt'))
          );
        } catch (e) {
          if (!e.message.match('Failed PostProcess')) {
            throw e;
          }
        }

        expect(iosocket.emit).toHaveBeenCalledWith(
          'conversionFailed',
          TestEmitSources.currentTenant,
          'sharedId1',
          expect.objectContaining({ status: 'failed' })
        );
      });
    });
  });

  describe('DELETE /files', () => {
    beforeEach(async () => {
      await testingEnvironment.setUp(fixtures);
    });
    it('should delete thumbnails asociated with documents deleted', async () => {
      mockCurrentUser(adminUser);
      await socketEmit('documentProcessed', async () =>
        uploadDocument('testing_files/english_testing_file.pdf')
      );
      const [file]: FileType[] = await files.get({
        originalname: 'english_testing_file.pdf',
      });

      const response = await request(app).delete('/api/files').query({
        _id: file._id?.toString(),
      });

      expect(response).toHaveStatus(200);

      const [deletedFile]: FileType[] = await files.get({
        originalname: 'english_testing_file.pdf',
      });

      const [thumbnail]: FileType[] = await files.get({
        filename: `${file._id}.jpg`,
      });

      expect(deletedFile).not.toBeDefined();
      expect(thumbnail).not.toBeDefined();
    });
  });
});
