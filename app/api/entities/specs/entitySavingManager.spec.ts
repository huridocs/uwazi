import db from 'api/utils/testing_db';
import { search } from 'api/search';
import { saveEntity } from 'api/entities/entitySavingManager';
import { errorLog } from 'api/log';
import { files as filesAPI } from 'api/files';
import { EntityWithFilesSchema } from 'shared/types/entityType';
import {
  editorUser,
  entityId,
  fixtures,
  template1Id,
  template2Id,
  textFile,
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
          _id: entityId,
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
          _id: entityId,
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
          _id: entityId,
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
          _id: entityId,
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
          _id: entityId,
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
      it('should allow to set an image metadata field referencing an attached file', async () => {
        const imageFile = {
          originalname: 'image.jpg',
          mimetype: 'image/jpeg',
          size: 12,
          buffer: Buffer.from('sample content'),
        };
        const entity: EntityWithFilesSchema = {
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
          files: [imageFile],
        });

        const [savedFile] = await filesAPI.get({
          entity: savedEntity.sharedId,
          type: 'attachment',
        });

        console.log(savedFile);
        console.log(savedEntity.metadata.image);

        const imageNameInEntityMetadata = savedEntity.metadata.image[0].value.split('/')[2];

        expect(savedFile.originalname).toBe('image.jpg');

        expect(imageNameInEntityMetadata).toBe(savedFile.filename);
      });
    });
  });
});
