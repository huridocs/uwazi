import db from 'api/utils/testing_db';
import { saveEntity } from 'api/entities/entitySavingManager';
import {
  editorUser,
  entityId,
  fixtures,
  templateId,
  textFile,
  pdfFile,
} from './entitySavingManagerFixtures';

describe('entitySavingManager', () => {
  beforeEach(async () => {
    await db.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await db.disconnect();
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
        const entity = { title: 'newEntity', template: templateId };
        const savedEntity = await saveEntity(entity, { ...reqData });
        expect(savedEntity.permissions).toEqual([
          { level: 'write', refId: 'userId', type: 'user' },
        ]);
      });
      it('should create an entity with attachments', async () => {
        const entity = {
          title: 'newEntity',
          template: templateId,
          attachments: [{ originalname: 'Google link', url: 'https://google.com' }],
        };
        const savedEntity = await saveEntity(entity, { ...reqData, files: [file] });
        expect(savedEntity.attachments).toMatchObject([
          {
            mimetype: 'text/plain',
            originalname: 'sampleFile.txt',
            size: 12,
            type: 'attachment',
          },
          {
            mimetype: 'text/html; charset=ISO-8859-1',
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
          template: templateId,
        };
        const savedEntity = await saveEntity(entity, { ...reqData, files: [file] });
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
          template: templateId,
          attachments: [{ ...changedFile }, pdfFile],
        };

        const savedEntity = await saveEntity(entity, { ...reqData });
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
          template: templateId,
          attachments: [{ ...textFile }],
        };

        const savedEntity = await saveEntity(entity, { ...reqData });
        expect(savedEntity.attachments).toMatchObject([textFile]);
      });
    });
  });
});
