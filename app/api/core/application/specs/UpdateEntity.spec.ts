import { TestUtils } from '#api/common.v2/utils/Test.js';
import { EntityIcon } from '#api/core/domain/entity/Entity.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { UpdateEntityUseCaseFactory } from '#api/core/infrastructure/factories/UpdateEntityUseCaseFactory.js';
import { FileSystemStorage } from '#api/core/infrastructure/files/FileSystemStorage.js';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { EventsBus } from '#api/core/libs/eventsbus/EventsBus.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { factory, fixtures, SampleListener } from './UpdateEntityFixtures.js';

type TestConfig = {
  name: string;
  usePostgres: boolean;
};

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

const createSut = () => {
  const fileStorage = TestUtils.mockClass<FileSystemStorage>({ storeFile: jest.fn() });
  const eventBus = TestUtils.mockClass<EventsBus>({ emit: jest.fn() });

  return testingEnvironment.runWithContext(
    () => {
      const fs = FilesServiceFactory.default({ fileStorage, eventBus });
      jest.spyOn(fs, 'delete');

      const sut = UpdateEntityUseCaseFactory.default({ fileService: fs });

      return { sut, fileStorage };
    },
    { factories: { eventEmitter: () => EventEmitterFactory.default() } }
  );
};

describe('UpdateEntityUseCase', () => {
  const icon: EntityIcon = { id: 'iconId', type: 'entity', label: 'iconLabel' };

  const getAllEntities = async (sharedId: string) =>
    testingEnvironment.db.getCollection('entities')!.find({ sharedId }).toArray();

  const getAllFiles = async (entity: string) => {
    const files = await testingEnvironment.db.getAllFrom('files');
    return files.filter(f => f.entity === entity);
  };
  const getFileById = async (id: string) => {
    const files = await testingEnvironment.db.getAllFrom('files');
    return files.find(f => f._id!.toString() === factory.id(id).toString());
  };

  const getAllJobs = async () => getConnection().collection('jobs').find().toArray();
  const clearJobs = async () => getConnection().collection('jobs').deleteMany({});

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
    EventEmitterFactory.registry.register(SampleListener);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
    EventEmitterFactory.registry.reset();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        featureFlags: { postgresFiles: usePostgres },
      });
      await testingEnvironment.setFixtures(fixtures);
      await clearJobs();
    });

    it('should update basic entity data', async () => {
      const { sut } = createSut();

      const entitiesBefore = await getAllEntities('entity1');

      await sut.execute({ sharedId: 'entity1', language: 'en', icon, propertyAssignments: [] });

      const entities = await getAllEntities('entity1');
      expect(entitiesBefore).toMatchObject([
        {
          sharedId: 'entity1',
          title: 'Entity 1 EN',
          template: factory.id('Basic Template'),
          metadata: {},
          language: 'en',
        },
        {
          sharedId: 'entity1',
          title: 'Entity 1 PT',
          template: factory.id('Basic Template'),
          metadata: {},
          language: 'pt',
        },
      ]);

      expect(entities).toMatchObject([
        {
          sharedId: 'entity1',
          template: factory.id('Basic Template'),
          metadata: {},
          language: 'en',
          editDate: expect.any(Number),
          icon: { _id: 'iconId', label: 'iconLabel', type: 'entity' },
        },
        {
          sharedId: 'entity1',
          template: factory.id('Basic Template'),
          metadata: {},
          language: 'pt',
          editDate: expect.any(Number),
          icon: { _id: 'iconId', label: 'iconLabel', type: 'entity' },
        },
      ]);
    });

    it('should update title', async () => {
      const { sut } = createSut();

      await sut.execute({
        sharedId: 'entity1',
        language: 'en',
        propertyAssignments: [{ name: 'title', value: [{ value: 'Entity Updated EN' }] }],
      });

      const entities = await getAllEntities('entity1');

      expect(entities).toMatchObject([
        {
          sharedId: 'entity1',
          title: 'Entity Updated EN',
          template: factory.id('Basic Template'),
          metadata: {},
          language: 'en',
        },
        {
          sharedId: 'entity1',
          title: 'Entity 1 PT',
          template: factory.id('Basic Template'),
          metadata: {},
          language: 'pt',
        },
      ]);
    });

    describe('When Property Assignments gets updated', () => {
      it('should update property assignments', async () => {
        const { sut } = createSut();

        const now = Date.now();

        await sut.execute({
          sharedId: 'full_entity',
          language: 'en',
          propertyAssignments: [
            {
              name: 'title',
              value: [{ value: 'Title EN' }],
            },
            {
              name: 'text',
              value: [{ value: 'Text EN' }],
            },
            {
              name: 'markdown',
              value: [{ value: 'Markdown EN' }],
            },
            {
              name: 'numeric',
              value: [{ value: 0 }],
            },
            {
              name: 'date',
              value: [{ value: now }],
            },
            {
              name: 'multidate',
              value: [{ value: now }, { value: now + 1000 }],
            },
            {
              name: 'daterange',
              value: [{ value: { from: now, to: now + 1000 } }],
            },
            {
              name: 'multidaterange',
              value: [
                { value: { from: 1609459200, to: 1612137600 } },
                { value: { from: 1614556800, to: 1617235200 } },
                { value: { from: now, to: now + 1000 } },
              ],
            },
            {
              name: 'link',
              value: [{ value: { url: 'http://example.com', label: 'New Link' } }],
            },
            {
              name: 'geolocation_geolocation',
              value: [{ value: { lat: 10, lon: 10 } }],
            },
            {
              name: 'select',
              value: [{ value: 'blue_id' }],
            },
            {
              name: 'multiselect',
              value: [{ value: 'blue_id' }],
            },
            {
              name: 'relationship',
              value: [{ value: 'related_entity_2' }],
            },
            {
              name: 'image',
              value: [{ value: '' }], // This unlink the property assignment to the attached file.
            },
            {
              name: 'media',
              value: [{ value: '' }], // This unlink the property assignment to the attached file.
            },
            {
              name: 'nested',
              value: [
                {
                  value: {
                    child_text: [{ value: 'Child text value' }],
                    child_number: [{ value: 42 }],
                  },
                },
                {
                  value: {
                    child_text: [{ value: 'Second child text' }],
                    child_number: [{ value: 100 }],
                  },
                },
              ],
            },
          ],
        });

        const entities = await getAllEntities('full_entity');

        expect(entities).toMatchObject([
          {
            sharedId: 'full_entity',
            title: 'Title EN',
            template: factory.id('Full Template'),
            metadata: {
              text: [{ value: 'Text EN' }],
              numeric: [{ value: 0 }],
              markdown: [{ value: 'Markdown EN' }],
              generatedid: [{ value: 'GEN-123' }],
              date: [{ value: now }],
              multidate: [{ value: now }, { value: now + 1000 }],
              daterange: [{ value: { from: now, to: now + 1000 } }],
              multidaterange: [
                { value: { from: 1609459200, to: 1612137600 } },
                { value: { from: 1614556800, to: 1617235200 } },
                { value: { from: now, to: now + 1000 } },
              ],
              link: [{ value: { url: 'http://example.com', label: 'New Link' } }],
              geolocation_geolocation: [{ value: { lat: 10, lon: 10 } }],
              select: [{ value: 'blue_id', label: 'Blue in English' }],
              multiselect: [{ value: 'blue_id', label: 'Blue in English' }],
              relationship: [
                {
                  value: 'related_entity_2',
                  label: 'Related Entity 2 EN',
                  type: 'entity',
                  inheritedType: 'text',
                  inheritedValue: [{ value: 'Related Text 2 EN' }],
                },
              ],
              image: [],
              nested: [
                {
                  value: {
                    child_text: [{ value: 'Child text value' }],
                    child_number: [{ value: 42 }],
                  },
                },
                {
                  value: {
                    child_text: [{ value: 'Second child text' }],
                    child_number: [{ value: 100 }],
                  },
                },
              ],
              media: [],
            },
            language: 'en',
            editDate: expect.any(Number),
            icon: {
              _id: null,
              type: 'Empty',
            },
            obsoleteMetadata: [],
            permissions: [],
            published: false,
          },
          {
            sharedId: 'full_entity',
            title: 'Full Entity PT',
            template: factory.id('Full Template'),
            metadata: {
              text: [{ value: 'Some text value' }],
              numeric: [{ value: 0 }],
              markdown: [{ value: 'Some **markdown**' }],
              generatedid: [{ value: 'GEN-123' }],
              date: [{ value: now }],
              multidate: [{ value: now }, { value: now + 1000 }],
              daterange: [{ value: { from: now, to: now + 1000 } }],
              multidaterange: [
                { value: { from: 1609459200, to: 1612137600 } },
                { value: { from: 1614556800, to: 1617235200 } },
                { value: { from: now, to: now + 1000 } },
              ],
              link: [{ value: { url: 'https://uwazi.io', label: 'Uwazi' } }],
              image: [{ value: 'https://example.com/image.jpg' }],
              media: [{ value: 'https://example.com/video.mp4' }],
              geolocation_geolocation: [{ value: { lat: 10, lon: 10 } }],
              select: [{ value: 'blue_id', label: 'Blue in Portuguese' }],
              multiselect: [{ value: 'blue_id', label: 'Blue in Portuguese' }],
              relationship: [
                {
                  value: 'related_entity_2',
                  label: 'Related Entity 2 PT',
                  type: 'entity',
                  inheritedType: 'text',
                  inheritedValue: [{ value: 'Related Text 2 PT' }],
                },
              ],
              nested: [
                {
                  value: {
                    child_text: [{ value: 'Child text value' }],
                    child_number: [{ value: 42 }],
                  },
                },
                {
                  value: {
                    child_text: [{ value: 'Second child text' }],
                    child_number: [{ value: 100 }],
                  },
                },
              ],
            },
            language: 'pt',
            editDate: expect.any(Number),
            icon: {
              _id: null,
              type: 'Empty',
            },
            obsoleteMetadata: [],
            permissions: [],
            published: false,
          },
        ]);
      });

      it('should denormalize relationship icons correctly for mixed related entities', async () => {
        const { sut } = createSut();

        await sut.execute({
          sharedId: 'full_entity',
          language: 'en',
          propertyAssignments: [
            {
              name: 'relationship',
              value: [{ value: 'related_entity' }, { value: 'related_entity_2' }],
            },
          ],
        });

        const entities = await getAllEntities('full_entity');

        expect(entities).toMatchObject([
          {
            sharedId: 'full_entity',
            language: 'en',
            metadata: {
              relationship: [
                {
                  value: 'related_entity',
                  label: 'Related Entity EN',
                  type: 'entity',
                  icon: {
                    _id: 'related_entity_icon',
                    label: 'Related Entity Icon',
                    type: 'img',
                  },
                  inheritedType: 'text',
                  inheritedValue: [{ value: 'Related Text EN' }],
                },
                {
                  value: 'related_entity_2',
                  label: 'Related Entity 2 EN',
                  type: 'entity',
                  inheritedType: 'text',
                  inheritedValue: [{ value: 'Related Text 2 EN' }],
                },
              ],
            },
          },
          {
            sharedId: 'full_entity',
            language: 'pt',
            metadata: {
              relationship: [
                {
                  value: 'related_entity',
                  label: 'Related Entity PT',
                  type: 'entity',
                  icon: {
                    _id: 'related_entity_icon',
                    label: 'Related Entity Icon',
                    type: 'img',
                  },
                  inheritedType: 'text',
                  inheritedValue: [{ value: 'Related Text PT' }],
                },
                {
                  value: 'related_entity_2',
                  label: 'Related Entity 2 PT',
                  type: 'entity',
                  inheritedType: 'text',
                  inheritedValue: [{ value: 'Related Text 2 PT' }],
                },
              ],
            },
          },
        ]);

        expect(entities[0].metadata.relationship[1].icon).toBeUndefined();
        expect(entities[1].metadata.relationship[1].icon).toBeUndefined();
      });

      it('should clear metadata when given empty or nullable values', async () => {
        const { sut } = createSut();

        await sut.execute({
          sharedId: 'full_entity',
          language: 'en',
          propertyAssignments: [
            {
              name: 'text',
              value: [{ value: '' }],
            },
            {
              name: 'numeric',
              value: [{ value: '' }],
            },
            {
              name: 'select',
              value: [{ value: '' }],
            },
            {
              name: 'multiselect',
              value: [],
            },
            {
              name: 'relationship',
              value: [],
            },
            {
              name: 'date',
              value: [],
            },
            {
              name: 'multidate',
              value: [],
            },
            {
              name: 'daterange',
              value: [],
            },
            {
              name: 'multidaterange',
              value: [],
            },
            {
              name: 'link',
              value: [],
            },
            {
              name: 'geolocation_geolocation',
              value: [],
            },
          ],
        });

        const entities = await getAllEntities('full_entity');

        expect([entities[0].metadata, entities[1].metadata]).toMatchObject([
          {
            text: [],
            numeric: [],
            date: [],
            multidate: [],
            daterange: [],
            multidaterange: [],
            link: [],
            geolocation_geolocation: [],
            select: [],
            multiselect: [],
            relationship: [],

            nested: [
              {
                value: {
                  child_text: [{ value: 'Child text value' }],
                  child_number: [{ value: 100 }],
                },
              },
            ],
            markdown: [{ value: 'Some **markdown**' }],
            generatedid: [{ value: 'GEN-123' }],
            image: [{ value: 'https://example.com/image.jpg' }],
            preview: [],
            media: [{ value: 'https://example.com/video.mp4' }],
          },
          {
            numeric: [],
            date: [],
            multidate: [],
            daterange: [],
            multidaterange: [],
            geolocation_geolocation: [],
            select: [],
            multiselect: [],
            relationship: [],

            text: [{ value: 'Some text value' }],
            markdown: [{ value: 'Some **markdown**' }],
            generatedid: [{ value: 'GEN-123' }],
            link: [{ value: { url: 'https://uwazi.io', label: 'Uwazi' } }],
            image: [{ value: 'https://example.com/image.jpg' }],
            nested: [
              {
                value: {
                  child_text: [{ value: 'Child text value' }],
                  child_number: [{ value: 100 }],
                },
              },
            ],
            preview: [],
            media: [{ value: 'https://example.com/video.mp4' }],
          },
        ]);
      });
      it('should throw when a required property has no value', async () => {
        const { sut } = createSut();

        await expect(
          sut.execute({
            sharedId: 'required_entity',
            language: 'en',
            propertyAssignments: [{ name: 'required_text', value: [{ value: '' }] }],
          })
        ).rejects.toThrow('Text Property is required');
      });
    });

    describe('When Files gets uploaded', () => {
      it('should properly create url attachments', async () => {
        const { sut, fileStorage } = createSut();

        await sut.execute({
          language: 'en',
          sharedId: 'required_entity',
          propertyAssignments: [],
          uploadedFiles: [
            InputFile.createUrlAttachment({
              originalname: 'example attachment',
              url: 'https://example.com/external-file.pdf',
            }),
          ],
        });

        const files = await getAllFiles('required_entity');

        expect(fileStorage.storeFile).not.toHaveBeenCalled();

        expect(files).toMatchObject([
          {
            entity: 'required_entity',
            originalname: 'example attachment',
            url: 'https://example.com/external-file.pdf',
            type: 'attachment',
          },
        ]);
      });

      it('should add files', async () => {
        const { sut, fileStorage } = createSut();

        await sut.execute({
          language: 'en',
          sharedId: 'entity1',
          propertyAssignments: [],
          uploadedFiles: [
            new InputFile(
              {
                fieldname: 'documents[0]',
                encoding: '7bit',
                mimetype: 'application/pdf',
                destination: '/tmp',
                originalname: 'primary_1.pdf',
                filename: 'primary_1.pdf',
                path: '/tmp/primary_1.pdf',
                size: 78636,
              },
              'document'
            ),

            new InputFile(
              {
                fieldname: 'documents[1]',
                encoding: '7bit',
                mimetype: 'application/pdf',
                destination: '/tmp',
                originalname: 'primary_2.pdf',
                filename: 'primary_2.pdf',
                path: '/tmp/primary_2.pdf',
                size: 78636,
              },
              'document'
            ),

            new InputFile(
              {
                fieldname: 'attachments[0]',
                encoding: '7bit',
                mimetype: 'image/png',
                destination: '/tmp',
                originalname: 'attachment_1.png',
                filename: 'attachment_1.png',
                path: '/tmp/attachment_1.png',
                size: 78636,
              },
              'attachment'
            ),
          ],
        });

        expect(fileStorage.storeFile).toHaveBeenCalledWith(
          expect.objectContaining({ originalname: 'primary_1.pdf' })
        );
        expect(fileStorage.storeFile).toHaveBeenCalledWith(
          expect.objectContaining({ originalname: 'primary_2.pdf' })
        );
        expect(fileStorage.storeFile).toHaveBeenCalledWith(
          expect.objectContaining({ originalname: 'attachment_1.png' })
        );

        const files = await getAllFiles('entity1');

        expect(files).toMatchObject([
          { originalname: 'primary_1.pdf' },
          { originalname: 'primary_2.pdf' },
          { originalname: 'attachment_1.png' },
        ]);
      });

      it('should link image property to uploaded file', async () => {
        const { sut } = createSut();

        await sut.execute({
          language: 'en',
          sharedId: 'full_entity',
          propertyAssignments: [
            {
              name: 'image',
              value: [{ value: '', attachment: 0 }],
            },
          ],
          uploadedFiles: [
            new InputFile(
              {
                fieldname: 'attachments[0]',
                encoding: '7bit',
                mimetype: 'image/png',
                destination: '/tmp',
                originalname: 'new_image.png',
                filename: 'generated_filename_123.png',
                path: '/tmp/generated_filename_123.png',
                size: 50000,
              },
              'attachment'
            ),
          ],
        });

        const entities = await getAllEntities('full_entity');

        expect(entities[0].metadata.image).toMatchObject([
          { value: '/api/files/generated_filename_123.png' },
        ]);
      });

      it('should link media property to uploaded file', async () => {
        const { sut } = createSut();

        await sut.execute({
          language: 'en',
          sharedId: 'full_entity',
          propertyAssignments: [
            {
              name: 'media',
              value: [{ value: '', attachment: 0 }],
            },
          ],
          uploadedFiles: [
            new InputFile(
              {
                fieldname: 'attachments[0]',
                encoding: '7bit',
                mimetype: 'video/mp4',
                destination: '/tmp',
                originalname: 'new_video.mp4',
                filename: 'generated_video_456.mp4',
                path: '/tmp/generated_video_456.mp4',
                size: 1000000,
              },
              'attachment'
            ),
          ],
        });

        const entities = await getAllEntities('full_entity');

        expect(entities[0].metadata.media).toMatchObject([
          { value: '/api/files/generated_video_456.mp4' },
        ]);
      });

      it('should link media property with timeLinks to uploaded file', async () => {
        const { sut } = createSut();

        await sut.execute({
          language: 'en',
          sharedId: 'full_entity',
          propertyAssignments: [
            {
              name: 'media',
              value: [{ value: '', attachment: 0, timeLinks: '{"start": 10, "end": 20}' }],
            },
          ],
          uploadedFiles: [
            new InputFile(
              {
                fieldname: 'attachments[0]',
                encoding: '7bit',
                mimetype: 'video/mp4',
                destination: '/tmp',
                originalname: 'video_with_timelinks.mp4',
                filename: 'generated_video_789.mp4',
                path: '/tmp/generated_video_789.mp4',
                size: 1000000,
              },
              'attachment'
            ),
          ],
        });

        const entities = await getAllEntities('full_entity');

        expect(entities[0].metadata.media).toMatchObject([
          { value: '(/api/files/generated_video_789.mp4, {"start": 10, "end": 20})' },
        ]);
      });

      it('should link multiple files to different properties in same request', async () => {
        const { sut } = createSut();

        await sut.execute({
          language: 'en',
          sharedId: 'full_entity',
          propertyAssignments: [
            {
              name: 'image',
              value: [{ value: '', attachment: 0 }],
            },
            {
              name: 'media',
              value: [{ value: '', attachment: 1, timeLinks: '{"label": "intro"}' }],
            },
          ],
          uploadedFiles: [
            new InputFile(
              {
                fieldname: 'attachments[0]',
                encoding: '7bit',
                mimetype: 'image/jpeg',
                destination: '/tmp',
                originalname: 'photo.jpg',
                filename: 'photo_abc.jpg',
                path: '/tmp/photo_abc.jpg',
                size: 50000,
              },
              'attachment'
            ),
            new InputFile(
              {
                fieldname: 'attachments[1]',
                encoding: '7bit',
                mimetype: 'video/mp4',
                destination: '/tmp',
                originalname: 'clip.mp4',
                filename: 'clip_xyz.mp4',
                path: '/tmp/clip_xyz.mp4',
                size: 800000,
              },
              'attachment'
            ),
          ],
        });

        const entities = await getAllEntities('full_entity');

        expect(entities[0].metadata.image).toMatchObject([{ value: '/api/files/photo_abc.jpg' }]);
        expect(entities[0].metadata.media).toMatchObject([
          { value: '(/api/files/clip_xyz.mp4, {"label": "intro"})' },
        ]);
      });
    });

    describe('When Files gets updated', () => {
      it('should rename existing files', async () => {
        const { sut } = createSut();

        const filesBefore = await getAllFiles('entity1');

        await sut.execute({
          language: 'en',
          sharedId: 'entity1',
          propertyAssignments: [],
          files: [
            {
              id: factory.id('entity1_doc1').toHexString(),
              originalname: 'Document 1 Renamed.pdf',
            },
            {
              id: factory.id('entity1_doc2').toHexString(),
              originalname: 'Document 2 Renamed.pdf',
            },
            {
              id: factory.id('entity1_attach1').toHexString(),
              originalname: 'Attachment 1 Renamed.txt',
            },
          ],
        });

        const filesAfter = await getAllFiles('entity1');

        expect(filesBefore).toHaveLength(5);
        expect(filesBefore).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              entity: 'entity1',
              filename: 'entity1_doc1',
              originalname: 'Document 1.pdf',
              language: 'eng',
            }),
            expect.objectContaining({
              entity: 'entity1',
              type: 'thumbnail',
              filename: `${factory.id('entity1_doc1').toHexString()}.jpg`,
              language: 'eng',
            }),
            expect.objectContaining({
              entity: 'entity1',
              filename: 'entity1_doc2',
              originalname: 'Document 2.pdf',
              language: 'eng',
            }),
            expect.objectContaining({
              entity: 'entity1',
              type: 'thumbnail',
              filename: `${factory.id('entity1_doc2').toHexString()}.jpg`,
              language: 'eng',
            }),
            expect.objectContaining({ entity: 'entity1', originalname: 'Attachment 1.txt' }),
          ])
        );

        expect(filesAfter).toHaveLength(5);
        expect(filesAfter).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              entity: 'entity1',
              filename: 'entity1_doc1',
              originalname: 'Document 1 Renamed.pdf',
              language: 'eng',
            }),
            expect.objectContaining({
              entity: 'entity1',
              type: 'thumbnail',
              filename: `${factory.id('entity1_doc1').toHexString()}.jpg`,
              language: 'eng',
            }),
            expect.objectContaining({
              entity: 'entity1',
              filename: 'entity1_doc2',
              originalname: 'Document 2 Renamed.pdf',
              language: 'eng',
            }),
            expect.objectContaining({
              entity: 'entity1',
              type: 'thumbnail',
              filename: `${factory.id('entity1_doc2').toHexString()}.jpg`,
              language: 'eng',
            }),
            expect.objectContaining({
              entity: 'entity1',
              originalname: 'Attachment 1 Renamed.txt',
            }),
          ])
        );
      });

      it('should persist property selections on the selected file', async () => {
        const { sut } = createSut();

        await sut.execute({
          language: 'en',
          sharedId: 'entity1',
          propertyAssignments: [],
          files: [
            {
              id: factory.id('entity1_doc1').toHexString(),
              originalname: 'Document 1 changed.pdf',
            },
            {
              id: factory.id('entity1_doc2').toHexString(),
              originalname: 'Document 2.pdf',
            },
            {
              id: factory.id('entity1_attach1').toHexString(),
              originalname: 'Attachment 1.txt',
            },
          ],
          propertySelections: {
            fileId: factory.id('entity1_doc1').toHexString(),
            selections: [
              {
                name: 'title',
                selection: {
                  text: 'Entity 1 EN',
                  selectionRectangles: [{ top: 10, left: 20, width: 30, height: 40, page: '1' }],
                },
              },
            ],
          },
        });

        const file = await getFileById('entity1_doc1');

        expect(file).toMatchObject({
          entity: 'entity1',
          originalname: 'Document 1 changed.pdf',
          propertySelections: [
            {
              name: 'title',
              selection: {
                text: 'Entity 1 EN',
                selectionRectangles: [{ top: 10, left: 20, width: 30, height: 40, page: '1' }],
              },
            },
          ],
        });
      });

      it('should not persist property selections if selected file does not belong to entity', async () => {
        const { sut } = createSut();

        await sut.execute({
          language: 'en',
          sharedId: 'entity1',
          propertyAssignments: [],
          files: [
            {
              id: factory.id('entity1_doc1').toHexString(),
              originalname: 'Document 1.pdf',
            },
            {
              id: factory.id('entity1_doc2').toHexString(),
              originalname: 'Document 2.pdf',
            },
            {
              id: factory.id('entity1_attach1').toHexString(),
              originalname: 'Attachment 1.txt',
            },
          ],
          propertySelections: {
            fileId: factory.id('non_existing_file').toHexString(),
            selections: [
              {
                name: 'title',
                selection: {
                  text: 'Should not be saved',
                  selectionRectangles: [{ top: 10, left: 20, width: 30, height: 40, page: '1' }],
                },
              },
            ],
          },
        });

        const file = await getFileById('entity1_doc1');

        expect(file?.propertySelections ?? undefined).toBeUndefined();
      });
    });

    describe('When Files gets removed', () => {
      it('should delete files that are not in the files array', async () => {
        const { sut } = createSut();

        await sut.execute({
          language: 'en',
          sharedId: 'entity1',
          propertyAssignments: [],
          files: [
            {
              id: factory.id('entity1_doc1').toHexString(),
              originalname: 'Document 1.pdf',
            },
          ],
        });

        const filesAfter = await getAllFiles('entity1');

        expect(filesAfter).toHaveLength(2);
        expect(filesAfter).toMatchObject([
          {
            filename: 'entity1_doc1',
            originalname: 'Document 1.pdf',
            entity: 'entity1',
            type: 'document',
          },
          {
            entity: 'entity1',
            type: 'thumbnail',
            filename: `${factory.id('entity1_doc1').toHexString()}.jpg`,
          },
        ]);
      });
    });

    it('should emit EntityUpdatedEvent after updating the entity', async () => {
      const { sut } = createSut();

      await sut.execute({
        language: 'en',
        sharedId: 'entity1',
        propertyAssignments: [{ name: 'title', value: [{ value: 'Entity Updated EN' }] }],
      });

      const jobs = await getAllJobs();

      expect(jobs.length).toBeGreaterThanOrEqual(1);

      expect(jobs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            queue: 'uwazi_jobs',
            name: 'EntityUpdatedEvent:SampleListener',
            params: expect.objectContaining({
              after: expect.any(Object),
              before: expect.any(Object),
              userId: expect.any(String),
              targetLanguage: 'en',
            }),
          }),
        ])
      );
    });

    it('should change entity template', async () => {
      const { sut } = createSut();

      await sut.execute({
        sharedId: 'entity1',
        language: 'en',
        templateId: factory.id('Full Template').toHexString(),
        propertyAssignments: [
          { name: 'title', value: [{ value: 'Entity with new template' }] },
          { name: 'text', value: [{ value: 'Some text' }] },
          { name: 'numeric', value: [{ value: 100 }] },
        ],
      });

      const entities = await getAllEntities('entity1');

      expect(entities).toMatchObject([
        {
          sharedId: 'entity1',
          title: 'Entity with new template',
          template: factory.id('Full Template'),
          language: 'en',
          metadata: {
            text: [{ value: 'Some text' }],
            numeric: [{ value: 100 }],
          },
        },
        {
          sharedId: 'entity1',
          title: 'Entity 1 PT',
          template: factory.id('Full Template'),
          language: 'pt',
          metadata: {
            text: [],
            numeric: [{ value: 100 }],
          },
        },
      ]);
    });

    describe('preview is updated when documents with thumbnails are removed', () => {
      const getEntities = async (sharedId: string) =>
        testingEnvironment.db.getCollection('entities')!.find({ sharedId }).toArray();

      describe('when only deleting a document', () => {
        it('should set preview to the surviving thumbnail on all translations', async () => {
          const { sut } = createSut();

          // entity1 has doc1 (thumbnail) and doc2 (thumbnail) — remove doc2, keep doc1
          await sut.execute({
            language: 'en',
            sharedId: 'entity1',
            propertyAssignments: [],
            files: [
              {
                id: factory.id('entity1_doc1').toHexString(),
                originalname: 'Document 1.pdf',
              },
            ],
          });

          const entities = await getEntities('entity1');
          const expectedPreview = `${factory.id('entity1_doc1').toHexString()}.jpg`;

          entities.forEach(translation => {
            expect(translation.preview).toBe(expectedPreview);
          });
        });

        it('should clear preview on all translations when all documents are removed', async () => {
          const { sut } = createSut();

          // Remove all files
          await sut.execute({
            language: 'en',
            sharedId: 'entity1',
            propertyAssignments: [],
            files: [],
          });

          const entities = await getEntities('entity1');

          entities.forEach(translation => {
            expect(translation.preview).toBeUndefined();
          });
        });
      });

      describe('when deleting a document and uploading a new one', () => {
        it('should set preview to the surviving thumbnail (new doc has no thumbnail yet)', async () => {
          const { sut } = createSut();

          // Remove doc2, keep doc1, add a new document upload
          await sut.execute({
            language: 'en',
            sharedId: 'entity1',
            propertyAssignments: [],
            files: [
              {
                id: factory.id('entity1_doc1').toHexString(),
                originalname: 'Document 1.pdf',
              },
            ],
            uploadedFiles: [
              new InputFile(
                {
                  fieldname: 'documents[0]',
                  encoding: '7bit',
                  mimetype: 'application/pdf',
                  destination: '/tmp',
                  originalname: 'new_doc.pdf',
                  filename: 'new_doc.pdf',
                  path: '/tmp/new_doc.pdf',
                  size: 50000,
                },
                'document'
              ),
            ],
          });

          const entities = await getEntities('entity1');
          // doc1's thumbnail survives; newly uploaded doc has no thumbnail yet
          const expectedPreview = `${factory.id('entity1_doc1').toHexString()}.jpg`;

          entities.forEach(translation => {
            expect(translation.preview).toBe(expectedPreview);
          });
        });
      });
    });
  });
});
