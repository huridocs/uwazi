/* eslint-disable max-statements */
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { MongoTemplateMapper } from 'api/core/infrastructure/mongodb/template/MongoTemplateMapper';
import { PropertyNotFoundError } from 'api/core/domain/template/errors';
import { InputFile } from 'api/files.v2/model/InputFile';
import { MediaPropertyAssignmentCreatorService } from '../propertyAssignmentCreatorService/MediaPropertyAssignmentCreatorService';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { default: true, key: 'en', label: 'English' },
        { key: 'pt', label: 'Portuguese' },
      ],
    },
  ],

  templates: [
    factory.template('Document', [
      factory.property('url_media', 'media'),
      factory.property('attached_media_1', 'media'),
      factory.property('attached_media_2', 'media'),
      factory.property('required_media', 'media', { required: true }),
    ]),
  ],
};

const createSut = () => {
  const sut = new MediaPropertyAssignmentCreatorService();

  return { sut };
};

describe('MediaPropertyAssignmentCreatorService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  beforeEach(async () => testingEnvironment.setFixtures(fixtures));

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('URL-based media', () => {
    it('should create a property assignment from a URL and keep it unchanged', async () => {
      const { sut } = createSut();
      const templateDBO = await testingEnvironment.db
        .getCollection('templates')!
        .findOne({ _id: factory.id('Document') });

      const template = MongoTemplateMapper.toDomain(templateDBO as any);

      const result = await sut.create({
        template,
        propertyAssignment: {
          name: 'url_media',
          value: [{ value: 'https://www.youtube.com/watch?v=kvX9Hbg7q88' }],
        },
      });

      expect(result).toEqual([
        {
          name: 'url_media',
          type: 'media',
          value: [{ value: 'https://www.youtube.com/watch?v=kvX9Hbg7q88' }],
        },
      ]);
    });

    it('should handle URL with timelinks metadata', async () => {
      const { sut } = createSut();
      const templateDBO = await testingEnvironment.db
        .getCollection('templates')!
        .findOne({ _id: factory.id('Document') });

      const template = MongoTemplateMapper.toDomain(templateDBO as any);

      const result = await sut.create({
        template,
        propertyAssignment: {
          name: 'url_media',
          value: [
            {
              value:
                '(https://www.youtube.com/watch?v=kvX9Hbg7q88, {"timelinks":{"00:00:00":"title"}})',
            },
          ],
        },
      });

      expect(result).toEqual([
        {
          name: 'url_media',
          type: 'media',
          value: [
            {
              value:
                '(https://www.youtube.com/watch?v=kvX9Hbg7q88, {"timelinks":{"00:00:00":"title"}})',
            },
          ],
        },
      ]);
    });
  });

  describe('Attachment-based media', () => {
    it('should map an attachment index to a file path under /api/files/', async () => {
      const { sut } = createSut();
      const templateDBO = await testingEnvironment.db
        .getCollection('templates')!
        .findOne({ _id: factory.id('Document') });

      const template = MongoTemplateMapper.toDomain(templateDBO as any);

      const attachments = [
        new InputFile({ filename: 'video.mp4' } as any, 'attachment'),
        new InputFile({ filename: 'audio.mp3' } as any, 'attachment'),
      ];

      const result = await sut.create({
        template,
        attachments,
        propertyAssignment: {
          name: 'attached_media_1',
          value: [{ attachment: 0 }],
        },
      });

      expect(result).toEqual([
        {
          name: 'attached_media_1',
          type: 'media',
          value: [{ value: '/api/files/video.mp4' }],
        },
      ]);
    });

    it('should map an attachment with the correct index', async () => {
      const { sut } = createSut();
      const templateDBO = await testingEnvironment.db
        .getCollection('templates')!
        .findOne({ _id: factory.id('Document') });

      const template = MongoTemplateMapper.toDomain(templateDBO as any);

      const attachments = [
        new InputFile({ filename: 'video.mp4' } as any, 'attachment'),
        new InputFile({ filename: 'audio.mp3' } as any, 'attachment'),
      ];

      const result = await sut.create({
        template,
        attachments,
        propertyAssignment: {
          name: 'attached_media_2',
          value: [{ attachment: 1 }],
        },
      });

      expect(result).toEqual([
        {
          name: 'attached_media_2',
          type: 'media',
          value: [{ value: '/api/files/audio.mp3' }],
        },
      ]);
    });

    it('should map attachment with timeLinks metadata', async () => {
      const { sut } = createSut();
      const templateDBO = await testingEnvironment.db
        .getCollection('templates')!
        .findOne({ _id: factory.id('Document') });

      const template = MongoTemplateMapper.toDomain(templateDBO as any);

      const attachments = [new InputFile({ filename: 'video.mp4' } as any, 'attachment')];

      const result = await sut.create({
        template,
        attachments,
        propertyAssignment: {
          name: 'attached_media_1',
          value: [{ attachment: 0, timeLinks: '{"timelinks":{"00:00:00":"titleeeeee"}}' }],
        },
      });

      expect(result).toEqual([
        {
          name: 'attached_media_1',
          type: 'media',
          value: [{ value: '(/api/files/video.mp4, {"timelinks":{"00:00:00":"titleeeeee"}})' }],
        },
      ]);
    });

    it('should handle attachment with empty timeLinks', async () => {
      const { sut } = createSut();
      const templateDBO = await testingEnvironment.db
        .getCollection('templates')!
        .findOne({ _id: factory.id('Document') });

      const template = MongoTemplateMapper.toDomain(templateDBO as any);

      const attachments = [new InputFile({ filename: 'video.mp4' } as any, 'attachment')];

      const result = await sut.create({
        template,
        attachments,
        propertyAssignment: {
          name: 'attached_media_1',
          value: [{ attachment: 0, timeLinks: '' }],
        },
      });

      expect(result).toEqual([
        {
          name: 'attached_media_1',
          type: 'media',
          value: [{ value: '/api/files/video.mp4' }],
        },
      ]);
    });

    it('should throw error when attachment index is missing', async () => {
      const { sut } = createSut();
      const templateDBO = await testingEnvironment.db
        .getCollection('templates')!
        .findOne({ _id: factory.id('Document') });

      const template = MongoTemplateMapper.toDomain(templateDBO as any);

      await expect(
        sut.create({
          template,
          attachments: [new InputFile({ filename: 'onlyOne.mp4' } as any, 'attachment')],
          propertyAssignment: {
            name: 'attached_media_1',
            value: [{ attachment: 5 }],
          },
        })
      ).rejects.toThrow('Attachment with index 5 not found.');
    });

    it('should throw error when attachments array is undefined', async () => {
      const { sut } = createSut();
      const templateDBO = await testingEnvironment.db
        .getCollection('templates')!
        .findOne({ _id: factory.id('Document') });

      const template = MongoTemplateMapper.toDomain(templateDBO as any);

      await expect(
        sut.create({
          template,
          propertyAssignment: {
            name: 'attached_media_1',
            value: [{ attachment: 0 }],
          },
        })
      ).rejects.toThrow('Attachment with index 0 not found.');
    });
  });

  describe('Error handling', () => {
    it('throws if the property name does not exist in the template', async () => {
      const { sut } = createSut();
      const templateDBO = await testingEnvironment.db
        .getCollection('templates')!
        .findOne({ _id: factory.id('Document') });

      const template = MongoTemplateMapper.toDomain(templateDBO as any);

      await expect(
        sut.create({
          template,
          propertyAssignment: {
            name: 'non_existent_property',
            value: [{ value: 'https://example.com/video.mp4' }],
          },
        })
      ).rejects.toThrow(PropertyNotFoundError);
    });

    it('should throw when value is an empty string', async () => {
      const { sut } = createSut();
      const templateDBO = await testingEnvironment.db
        .getCollection('templates')!
        .findOne({ _id: factory.id('Document') });

      const template = MongoTemplateMapper.toDomain(templateDBO as any);

      await expect(
        sut.create({
          template,
          propertyAssignment: {
            name: 'url_media',
            value: [{ value: '' }],
          },
        })
      ).rejects.toThrow('Media Property value must be a non-empty string.');
    });

    it('should throw when value is only whitespace', async () => {
      const { sut } = createSut();
      const templateDBO = await testingEnvironment.db
        .getCollection('templates')!
        .findOne({ _id: factory.id('Document') });

      const template = MongoTemplateMapper.toDomain(templateDBO as any);

      await expect(
        sut.create({
          template,
          propertyAssignment: {
            name: 'url_media',
            value: [{ value: '   ' }],
          },
        })
      ).rejects.toThrow('Media Property value must be a non-empty string.');
    });

    it('should throw when required property has no value', async () => {
      const { sut } = createSut();
      const templateDBO = await testingEnvironment.db
        .getCollection('templates')!
        .findOne({ _id: factory.id('Document') });

      const template = MongoTemplateMapper.toDomain(templateDBO as any);

      await expect(
        sut.create({
          template,
          propertyAssignment: {
            name: 'required_media',
            value: [],
          },
        })
      ).rejects.toThrow('Media Property is required');
    });

    it('should throw when more than one value is provided', async () => {
      const { sut } = createSut();
      const templateDBO = await testingEnvironment.db
        .getCollection('templates')!
        .findOne({ _id: factory.id('Document') });

      const template = MongoTemplateMapper.toDomain(templateDBO as any);

      await expect(
        sut.create({
          template,
          propertyAssignment: {
            name: 'url_media',
            value: [
              { value: 'https://example.com/video1.mp4' },
              { value: 'https://example.com/video2.mp4' },
            ],
          },
        })
      ).rejects.toThrow('Media Property only accepts a single value.');
    });
  });

  describe('Edge cases', () => {
    it('should handle media property with no value for non-required field', async () => {
      const { sut } = createSut();
      const templateDBO = await testingEnvironment.db
        .getCollection('templates')!
        .findOne({ _id: factory.id('Document') });

      const template = MongoTemplateMapper.toDomain(templateDBO as any);

      const result = await sut.create({
        template,
        propertyAssignment: {
          name: 'url_media',
          value: [],
        },
      });

      expect(result).toEqual([
        {
          name: 'url_media',
          type: 'media',
          value: [],
        },
      ]);
    });
  });
});
