/* eslint-disable max-lines */
import { ObjectId } from 'mongodb';
import db from 'api/utils/testing_db';
import { search } from 'api/search';
import { saveEntity } from 'api/entities/entitySavingManager';
import { errorLog } from 'api/log';
import { files as filesAPI } from 'api/files';
import * as processDocumentApi from 'api/files/processDocument';
import { EntityWithFilesSchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';
import { advancedSort } from 'app/utils/advancedSort';
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
  entity3Id,
  mainPdfFile,
  entity3textFile,
  mainPdfFileId,
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

  const buffer = Buffer.from('sample content');

  const file = {
    originalname: 'sampleFile.txt',
    mimetype: 'text/plain',
    size: 12,
    buffer,
  };

  const newMainPdfDocument = {
    encoding: '7bit',
    originalname: 'myNewFile.pdf',
    mimetype: 'application/pdf',
    size: 12,
    buffer,
  };

  describe('saveEntity', () => {
    const reqData = { user: editorUser, language: 'en', socketEmiter: () => {} };

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

        const { entity: savedEntity } = await saveEntity(entity, {
          ...reqData,
          files: [{ ...file, fieldname: 'attachments[0]' }],
        });

        expect(advancedSort(savedEntity.attachments, { property: 'originalname' })).toMatchObject([
          {
            mimetype: 'text/html',
            originalname: 'Google link',
            url: 'https://google.com',
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
    });

    describe('update entity', () => {
      it('should keep existing attachments', async () => {
        const entity = {
          _id: entity1Id,
          sharedId: 'shared1',
          title: 'newEntity',
          template: template1Id,
        };

        const { entity: savedEntity } = await saveEntity(entity, {
          ...reqData,
          files: [{ ...file, fieldname: 'attachments[0]' }],
        });

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
        expect(errors[0]).toBe('Could not save file/s: malformed url');
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
          files: [
            { ...newImageFile, fieldname: 'attachments[0]' },
            { ...newPdfFile, fieldname: 'attachments[1]' },
          ],
        });

        const savedFiles = await filesAPI.get({
          entity: savedEntity.sharedId,
        });

        const sortedSavedFiles = advancedSort(savedFiles, { property: 'originalname' });

        expect(sortedSavedFiles).toEqual([
          expect.objectContaining({ originalname: 'image.jpg' }),
          expect.objectContaining({ originalname: 'pdf.pdf' }),
        ]);

        expect(savedEntity.metadata.image[0].value).toBe(
          `/api/files/${sortedSavedFiles[0].filename}`
        );

        expect(savedEntity.metadata.image[0].attachment).toBe(undefined);
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
          files: [
            { ...newPdfFile, fieldname: 'attachments[0]' },
            { ...newImageFile, fieldname: 'attachments[1]' },
          ],
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
        expect(savedEntity.metadata.image[0].attachment).toBe(undefined);
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
          files: [{ ...newPdfFile, fieldname: 'attachments[1]' }],
        });

        const savedFiles = await filesAPI.get({
          entity: entity.sharedId,
        });

        expect(savedFiles).toEqual([
          expect.objectContaining({ originalname: 'Sample Text File.txt' }),
          expect.objectContaining({ originalname: 'pdf.pdf' }),
        ]);

        expect(savedEntity.metadata.image[0].value).toBe('');
        expect(savedEntity.metadata.image[0].attachment).toBe(undefined);
      });

      it('should not fail on empty values', async () => {
        const entity = {
          title: 'newEntity',
          template: template2Id,
          metadata: {
            image: [],
            text: [
              {
                value: 'a text',
              },
            ],
          },
        };

        const { entity: savedEntity } = await saveEntity(entity, {
          ...reqData,
          files: [{ ...newPdfFile, fieldname: 'attachments[1]' }],
        });

        expect(savedEntity._id).not.toBeNull();
        expect(savedEntity.metadata.text[0].value).toBe('a text');
        expect(savedEntity.metadata.image).toEqual([]);
      });
    });

    describe('entity with main documents', () => {
      let savedEntity: EntityWithFilesSchema;
      let expectedDocuments: FileType[];

      beforeEach(() => {
        savedEntity = {};
        expectedDocuments = [];
      });

      const expectCheck = (entity: EntityWithFilesSchema) => {
        expect(entity.documents).toMatchObject(expectedDocuments);
      };

      const emiter = jest
        .fn()
        .mockImplementation(event => event === 'documentProcessed' && expectCheck(savedEntity));

      it('should create an entity with main documents', async () => {
        const entity = {
          title: 'newEntity',
          template: template1Id,
        };

        expectedDocuments = [
          {
            mimetype: 'application/pdf',
            originalname: 'myNewFile.pdf',
            size: 12,
            type: 'document',
          },
        ];

        ({ entity: savedEntity } = await saveEntity(entity, {
          ...reqData,
          socketEmiter: emiter,
          files: [{ ...newMainPdfDocument, fieldname: 'documents[0]' }],
        }));
      });

      describe('updating an entity', () => {
        it('should keep existing documents', async () => {
          const entity = {
            _id: entity3Id,
            sharedId: 'shared3',
            title: 'entity3',
            template: template1Id,
          };

          expectedDocuments = [
            {
              entity: 'shared3',
              mimetype: 'application/pdf',
              originalname: 'Sample main PDF File.pdf',
              type: 'document',
            },
            {
              entity: 'shared3',
              mimetype: 'application/pdf',
              originalname: 'myNewFile.pdf',
              type: 'document',
            },
          ];

          ({ entity: savedEntity } = await saveEntity(entity, {
            ...reqData,
            files: [{ ...newMainPdfDocument, fieldname: 'documents[0]' }],
            socketEmiter: emiter,
          }));

          expect(savedEntity.attachments).toMatchObject([
            {
              mimetype: 'text/plain',
              originalname: 'Sample Text File.txt',
              filename: 'samplefile.txt',
              type: 'attachment',
            },
          ]);
        });

        it('should remove files and thumbnails for deleted documents', async () => {
          const entity = {
            _id: entity3Id,
            sharedId: 'shared3',
            title: 'entity3',
            template: template1Id,
            attachments: [entity3textFile],
          };

          expectedDocuments = [];

          ({ entity: savedEntity } = await saveEntity(entity, {
            ...reqData,
            socketEmiter: emiter,
          }));

          expect(savedEntity.attachments).toMatchObject([entity3textFile]);

          const entityFiles = await filesAPI.get({ entity: entity.sharedId });
          expect(entityFiles).toMatchObject([entity3textFile]);
        });

        it('should update files for renamed documents', async () => {
          const changedFile = { ...mainPdfFile, originalname: 'Renamed main pdf.pdf' };

          const entity = {
            _id: entity3Id,
            sharedId: 'shared3',
            title: 'entity3',
            template: template1Id,
            documents: [{ ...changedFile }],
          };

          ({ entity: savedEntity } = await saveEntity(entity, {
            ...reqData,
            socketEmiter: emiter,
          }));

          expectedDocuments = [
            {
              filename: 'samplepdffile.pdf',
              mimetype: 'application/pdf',
              originalname: 'Renamed main pdf.pdf',
              type: 'document',
            },
          ];
        });

        it('should not reprocess existing documents', async () => {
          jest
            .spyOn(processDocumentApi, 'processDocument')
            .mockResolvedValueOnce({ _id: db.id() as ObjectId });

          const changedFile = { ...mainPdfFile, originalname: 'Renamed main pdf.pdf' };

          const entity = {
            _id: entity3Id,
            sharedId: 'shared3',
            title: 'entity3',
            template: template1Id,
            documents: [{ ...changedFile }],
          };

          ({ entity: savedEntity } = await saveEntity(entity, {
            ...reqData,
            socketEmiter: emiter,
            files: [{ ...newMainPdfDocument, fieldname: 'documents[0]' }],
          }));

          expectedDocuments = [
            {
              filename: 'samplepdffile.pdf',
              mimetype: 'application/pdf',
              originalname: 'Renamed main pdf.pdf',
              type: 'document',
            },
            {
              mimetype: 'application/pdf',
              originalname: 'myNewFile.pdf',
              type: 'document',
            },
          ];

          expect(processDocumentApi.processDocument).not.toHaveBeenCalledWith('shared3', {
            _id: mainPdfFileId.toString(),
            originalname: 'Renamed main pdf.pdf',
          });
        });

        it('should return an error if an existing main document cannot be saved', async () => {
          jest.spyOn(filesAPI, 'save').mockRejectedValueOnce({ error: { name: 'failed' } });

          const { errors } = await saveEntity(
            {
              _id: entity3Id,
              sharedId: 'shared3',
              title: 'Entity with broken file',
              template: template1Id,
              documents: [{ ...mainPdfFile, originalname: 'changed.pdf' }],
            },
            {
              ...reqData,
              socketEmiter: emiter,
            }
          );
          expect(errors[0]).toBe('Could not save file/s: changed.pdf');
        });
      });
    });
  });
});
