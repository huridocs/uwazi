/* eslint-disable max-lines */
import db from 'api/utils/testing_db';
import { search } from 'api/search';
import { saveEntity } from 'api/entities/entitySavingManager';
import { errorLog } from 'api/log';
import { files as filesAPI } from 'api/files';
import { EntityWithFilesSchema } from 'shared/types/entityType';
import {
  editorUser,
  entity1Id,
  entity2Id,
  fixtures,
  template1Id,
  template2Id,
  textFile,
  anotherTextFile,
  pdfFile,
} from './entitySavingManagerFixtures';

describe('entitySavingManager', () => {
  beforeAll(() => {
    jest.spyOn(search, 'indexEntities').mockImplementation(jest.fn());
  });

  beforeEach(async () => {
    await db.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('saveEntity', () => {
    const reqData = { user: editorUser, language: 'en' };
    const buffer = Buffer.from('sample content');
    const file = {
      originalname: 'sampleFile.txt',
      mimetype: 'text/plain',
      size: 12,
      buffer,
    };

    describe('new entity', () => {
      it('should create an entity without attachments', async () => {
        const entity = { title: 'newEntity', template: template1Id };
        const { entity: savedEntity } = await saveEntity(entity, { ...reqData });
        expect(savedEntity.permissions).toEqual([
          { level: 'write', refId: 'userId', type: 'user' },
        ]);
      });

      it('should create an entity with attachments', async () => {
        const entity = {
          title: 'newEntity',
          template: template1Id,
          attachments: [{ originalname: 'Google link', url: 'https://google.com' }],
        };
        const { entity: savedEntity } = await saveEntity(entity, { ...reqData, files: [file] });
        expect(savedEntity.attachments).toMatchObject([
          {
            mimetype: 'text/plain',
            originalname: 'sampleFile.txt',
            size: 12,
            type: 'attachment',
          },
          {
            mimetype: 'text/html',
            originalname: 'Google link',
            url: 'https://google.com',
            type: 'attachment',
          },
        ]);
      });
    });

    describe('update entity', () => {
      it('should keep existing attachments', async () => {
        const entity = {
          _id: entity1Id,
          sharedId: 'shared1',
          title: 'newEntity',
          template: template1Id,
        };
        const { entity: savedEntity } = await saveEntity(entity, { ...reqData, files: [file] });
        expect(savedEntity.attachments).toMatchObject([
          {
            mimetype: 'text/plain',
            originalname: 'Sample Text File.txt',
            filename: 'samplefile.txt',
            type: 'attachment',
          },
          {
            mimetype: 'application/pdf',
            originalname: 'Sample PDF File.pdf',
            filename: 'samplepdffile.pdf',
            type: 'attachment',
          },
          {
            mimetype: 'text/plain',
            originalname: 'sampleFile.txt',
            size: 12,
            type: 'attachment',
          },
        ]);
      });

      it('should update files for renamed attachments', async () => {
        const changedFile = { ...textFile, originalname: 'newName.txt' };
        const entity = {
          _id: entity1Id,
          sharedId: 'shared1',
          title: 'newEntity',
          template: template1Id,
          attachments: [{ ...changedFile }, pdfFile],
        };

        const { entity: savedEntity } = await saveEntity(entity, { ...reqData });
        expect(savedEntity.attachments).toMatchObject([
          {
            mimetype: 'text/plain',
            originalname: 'newName.txt',
            filename: 'samplefile.txt',
            type: 'attachment',
          },
          {
            mimetype: 'application/pdf',
            originalname: 'Sample PDF File.pdf',
            filename: 'samplepdffile.pdf',
            type: 'attachment',
          },
        ]);
      });

      it('should remove files for deleted attachments', async () => {
        const entity = {
          _id: entity1Id,
          sharedId: 'shared1',
          title: 'newEntity',
          template: template1Id,
          attachments: [{ ...textFile }],
        };

        const { entity: savedEntity } = await saveEntity(entity, { ...reqData });
        expect(savedEntity.attachments).toMatchObject([textFile]);
      });
    });

    describe('file save error', () => {
      let entity: EntityWithFilesSchema;
      let originalSilent: boolean | undefined;

      beforeAll(() => {
        originalSilent = errorLog.transports[1].silent;
        errorLog.transports[1].silent = true;
        entity = {
          _id: entity1Id,
          sharedId: 'shared1',
          title: 'newEntity',
          template: template1Id,
          attachments: [{ ...textFile }, { originalname: 'malformed url', url: 'malformed' }],
        };
      });

      afterAll(() => {
        errorLog.transports[1].silent = originalSilent;
      });

      it('should continue saving if a file fails to save', async () => {
        const { entity: savedEntity } = await saveEntity(entity, { ...reqData });
        expect(savedEntity.attachments).toEqual([textFile]);
      });

      it('should return an error', async () => {
        const { errors } = await saveEntity(entity, { ...reqData });
        expect(errors[0]).toBe('Could not save supporting file/s: malformed url');
      });
    });

    describe('indexing entities', () => {
      it('should index entities', async () => {
        const entity = {
          _id: entity1Id,
          sharedId: 'shared1',
          title: 'newEntity',
          template: template1Id,
          attachments: [
            { ...textFile },
            { ...pdfFile },
            { originalname: 'new url', url: 'https://google.com' },
          ],
        };
        await saveEntity(entity, { ...reqData });
        expect(search.indexEntities).toHaveBeenCalledTimes(2);
      });
    });

    describe('entity with predefined image metadata fields', () => {
      const newImageFile = {
        originalname: 'image.jpg',
        mimetype: 'image/jpeg',
        size: 12,
        buffer,
      };
      const newPdfFile = {
        originalname: 'pdf.pdf',
        mimetype: 'text/pdf',
        size: 12,
        buffer,
      };

      it('should allow to set an image metadata field referencing an attached file that is not yet saved', async () => {
        const entity = {
          title: 'newEntity',
          template: template2Id,
          metadata: {
            image: [{ value: '', attachment: 0 }],
            text: [
              {
                value: 'a text',
              },
            ],
          },
        };

        const { entity: savedEntity } = await saveEntity(entity, {
          ...reqData,
          files: [newImageFile, newPdfFile],
        });

        const savedFiles = await filesAPI.get({
          entity: savedEntity.sharedId,
        });

        expect(savedFiles).toEqual([
          expect.objectContaining({ originalname: 'image.jpg' }),
          expect.objectContaining({ originalname: 'pdf.pdf' }),
        ]);

        expect(savedEntity.metadata.image[0].value).toBe(`/api/files/${savedFiles[0].filename}`);
      });

      it('should work when updating existing entities with other existing attachments', async () => {
        const entity = {
          _id: entity2Id,
          sharedId: 'shared2',
          title: 'entity2',
          template: template2Id,
          metadata: {
            image: [{ value: '', attachment: 1 }],
          },
          attachments: [anotherTextFile],
        };

        const { entity: savedEntity } = await saveEntity(entity, {
          ...reqData,
          files: [newPdfFile, newImageFile],
        });

        const savedFiles = await filesAPI.get({
          entity: entity.sharedId,
        });

        expect(savedFiles).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ originalname: 'Sample Text File.txt' }),
            expect.objectContaining({ originalname: 'image.jpg' }),
            expect.objectContaining({ originalname: 'pdf.pdf' }),
          ])
        );
        expect(savedFiles.length).toBe(3);

        const savedImage = savedFiles.find(f => f.originalname === 'image.jpg');
        expect(savedEntity.metadata.image[0].value).toBe(`/api/files/${savedImage!.filename}`);
      });

      it('should ignore references to non existing attachments', async () => {
        const entity = {
          _id: entity2Id,
          sharedId: 'shared2',
          title: 'entity2',
          template: template2Id,
          metadata: {
            image: [{ value: '', attachment: 5 }],
          },
          attachments: [anotherTextFile],
        };

        const { entity: savedEntity } = await saveEntity(entity, {
          ...reqData,
          files: [newPdfFile],
        });

        const savedFiles = await filesAPI.get({
          entity: entity.sharedId,
        });

        expect(savedFiles).toEqual([
          expect.objectContaining({ originalname: 'Sample Text File.txt' }),
          expect.objectContaining({ originalname: 'pdf.pdf' }),
        ]);

        expect(savedEntity.metadata.image[0].value).toBe('');
      });
    });
  });
});
