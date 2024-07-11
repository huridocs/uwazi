/* eslint-disable max-lines */
import { saveEntity } from 'api/entities/entitySavingManager';
import * as os from 'os';
import { attachmentsPath, fileExistsOnPath, files as filesAPI, uploadsPath } from 'api/files';
import * as processDocumentApi from 'api/files/processDocument';
import { search } from 'api/search';
import db from 'api/utils/testing_db';
import { advancedSort } from 'app/utils/advancedSort';
// eslint-disable-next-line node/no-restricted-import
import { writeFile } from 'fs/promises';
import { ObjectId } from 'mongodb';
import path from 'path';
import { EntityWithFilesSchema } from 'shared/types/entityType';
import waitForExpect from 'wait-for-expect';
import entities from '../entities';
import {
  anotherTextFile,
  editorUser,
  entity1Id,
  entity2Id,
  entity3Id,
  entity3textFile,
  fixtures,
  mainPdfFile,
  mainPdfFileId,
  pdfFile,
  template1Id,
  template2Id,
  textFile,
} from './entitySavingManagerFixtures';

const validPdfString = `
%PDF-1.0
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj
trailer<</Root 1 0 R>>
`;

const tmpDir = (filename: string) => path.join(os.tmpdir(), filename);

describe('entitySavingManager', () => {
  const file = {
    originalname: 'sampleFile.txt',
    mimetype: 'text/plain',
    size: 12,
    filename: 'generatedFileName.txt',
    path: tmpDir('generatedFileName.txt'),
    destination: tmpDir(''),
  };

  const newMainPdfDocument = {
    originalname: 'myNewFile.pdf',
    mimetype: 'application/pdf',
    size: 12,
    filename: 'generatedPDFFileName.pdf',
    path: tmpDir('generatedPDFFileName.pdf'),
    destination: tmpDir(''),
    fieldname: 'documents[0]',
  };

  beforeAll(async () => {
    await writeFile(file.path!, 'sample content');
    await writeFile(newMainPdfDocument.path!, validPdfString);
  });

  beforeEach(async () => {
    await db.setupFixturesAndContext(fixtures);
    jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());
  });

  afterAll(async () => {
    await db.disconnect();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

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

        expect(
          await fileExistsOnPath(
            attachmentsPath(
              savedEntity.attachments?.find(a => a.originalname === 'sampleFile.txt')?.filename
            )
          )
        ).toBe(true);
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

      beforeAll(() => {
        entity = {
          _id: entity1Id,
          sharedId: 'shared1',
          title: 'newEntity',
          template: template1Id,
          attachments: [{ ...textFile }, { originalname: 'malformed url', url: 'malformed' }],
        };
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
        filename: 'generatedNewImageName.jpg',
        path: tmpDir('generatedNewImageName.jpg'),
        destination: tmpDir(''),
      };

      const newPdfFile = {
        originalname: 'pdf.pdf',
        mimetype: 'application/pdf',
        size: 12,
        filename: 'generatedNewPDF.pdf',
        path: tmpDir('generatedNewPDF.pdf'),
        destination: tmpDir(''),
      };

      const newVideoFile = {
        originalname: 'video.mov',
        mimetype: 'video/quicktime',
        size: 47495791,
        filename: 'generatedVideo.pdf',
        path: tmpDir('generatedVideo.pdf'),
        destination: tmpDir(''),
      };

      it('should allow to set an image metadata field referencing an attached file that is not yet saved', async () => {
        await writeFile(newImageFile.path!, 'sample content');
        await writeFile(newPdfFile.path!, validPdfString);
        await writeFile(newVideoFile.path!, 'test info');
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
            video: [
              {
                value: '',
                attachment: 2,
                timeLinks: '{"timelinks":{"00:00:10":"a"}}',
              },
            ],
          },
        };

        const { entity: savedEntity } = await saveEntity(entity, {
          ...reqData,
          files: [
            { ...newImageFile, fieldname: 'attachments[0]' },
            { ...newPdfFile, fieldname: 'attachments[1]' },
            { ...newVideoFile, fieldname: 'attachments[2]' },
          ],
        });

        const savedFiles = await filesAPI.get({
          entity: savedEntity.sharedId,
        });

        const sortedSavedFiles = advancedSort(savedFiles, { property: 'originalname' });

        expect(sortedSavedFiles).toEqual([
          expect.objectContaining({ originalname: 'image.jpg' }),
          expect.objectContaining({ originalname: 'pdf.pdf' }),
          expect.objectContaining({ originalname: 'video.mov' }),
        ]);

        expect(savedEntity.metadata?.image?.[0].value).toBe(
          `/api/files/${sortedSavedFiles[0].filename}`
        );

        expect(savedEntity.metadata?.image?.[0].attachment).toBe(undefined);
        expect(savedEntity.metadata?.video?.[0].value).toBe(
          '(/api/files/generatedVideo.pdf, {"timelinks":{"00:00:10":"a"}})'
        );
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

        expect(savedEntity.metadata?.image?.[0].value).toBe(`/api/files/${savedImage?.filename}`);
        expect(savedEntity.metadata?.image?.[0].attachment).toBe(undefined);
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

        expect(savedEntity.metadata?.image?.[0].value).toBe('');
        expect(savedEntity.metadata?.image?.[0].attachment).toBe(undefined);
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
        expect(savedEntity.metadata?.text?.[0].value).toBe('a text');
        expect(savedEntity.metadata?.image).toEqual([]);
      });
    });

    describe('entity with main documents', () => {
      let savedEntity: EntityWithFilesSchema;

      const emiter = jest.fn();

      it('should create an entity with main documents', async () => {
        ({ entity: savedEntity } = await saveEntity(
          { title: 'newEntity', template: template1Id },
          {
            ...reqData,
            socketEmiter: emiter,
            files: [{ ...newMainPdfDocument, fieldname: 'documents[0]' }],
          }
        ));

        await waitForExpect(async () => {
          expect(emiter).toHaveBeenCalledWith('documentProcessed', savedEntity.sharedId);
        });

        const [processedEntity] = await entities.getUnrestrictedWithDocuments({
          _id: savedEntity._id,
        });
        expect(processedEntity?.documents).toMatchObject([
          { originalname: 'myNewFile.pdf', type: 'document' },
        ]);

        expect(await fileExistsOnPath(uploadsPath(processedEntity?.documents[0].filename))).toBe(
          true
        );
      });

      describe('updating an entity', () => {
        it('should keep existing documents', async () => {
          const entity = {
            _id: entity3Id,
            sharedId: 'shared3',
            title: 'entity3',
            template: template1Id,
          };

          ({ entity: savedEntity } = await saveEntity(entity, {
            ...reqData,
            files: [{ ...newMainPdfDocument, fieldname: 'documents[0]' }],
            socketEmiter: emiter,
          }));

          await waitForExpect(async () => {
            expect(emiter).toHaveBeenCalledWith('documentProcessed', savedEntity.sharedId);
          });

          const [processedEntity] = await entities.getUnrestrictedWithDocuments({
            _id: savedEntity._id,
          });

          expect(processedEntity.documents).toMatchObject([
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
          ]);

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

          ({ entity: savedEntity } = await saveEntity(entity, {
            ...reqData,
            socketEmiter: emiter,
          }));

          expect(savedEntity.attachments).toMatchObject([entity3textFile]);
          expect(savedEntity.documents).toMatchObject([]);

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

          expect(savedEntity.documents).toMatchObject([
            {
              filename: 'samplepdffile.pdf',
              mimetype: 'application/pdf',
              originalname: 'Renamed main pdf.pdf',
              type: 'document',
            },
          ]);
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

          await waitForExpect(async () => {
            expect(emiter).toHaveBeenCalledWith('documentProcessed', savedEntity.sharedId);
          });

          expect(savedEntity.documents).toMatchObject([
            {
              filename: 'samplepdffile.pdf',
              mimetype: 'application/pdf',
              originalname: 'Renamed main pdf.pdf',
              type: 'document',
            },
          ]);

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
