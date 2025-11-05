/* eslint-disable max-statements */
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { MongoTemplateMapper } from 'api/core/infrastructure/mongodb/template/MongoTemplateMapper';
import { PropertyNotFoundError } from 'api/core/domain/template/errors';
import { ImagePropertyAssignmentCreatorService } from '../propertyAssignmentCreatorService/ImagePropertyAssignmentCreatorService';

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
      factory.property('url_image', 'image'),
      factory.property('attached_image_1', 'image'),
      factory.property('attached_image_2', 'image'),
      factory.property('required_image', 'image', { required: true }),
    ]),
  ],
};

const createSut = () => {
  const sut = new ImagePropertyAssignmentCreatorService();

  return { sut };
};

describe('ImagePropertyAssignmentCreatorService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  beforeEach(async () => testingEnvironment.setFixtures(fixtures));

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create a property assignment from an URL and keep it unchanged', async () => {
    const { sut } = createSut();
    const templateDBO = await testingEnvironment.db
      .getCollection('templates')!
      .findOne({ _id: factory.id('Document') });

    const template = MongoTemplateMapper.toDomain(templateDBO as any);

    const result = await sut.create({
      template,
      propertyAssignment: {
        name: 'url_image',
        value: [{ value: 'https://example.com/image.jpg' }],
      },
    });

    expect(result).toEqual([
      {
        name: 'url_image',
        type: 'image',
        value: [{ value: 'https://example.com/image.jpg' }],
      },
    ]);
  });

  it('should map an attachment index to a file path under /api/files/', async () => {
    const { sut } = createSut();
    const templateDBO = await testingEnvironment.db
      .getCollection('templates')!
      .findOne({ _id: factory.id('Document') });

    const template = MongoTemplateMapper.toDomain(templateDBO as any);

    const attachments = [
      { filename: 'abc123.jpg' },
      { filename: 'def456.png' },
    ] as unknown as Express.Multer.File[];

    const result = await sut.create({
      template,
      attachments,
      propertyAssignment: {
        name: 'attached_image_1',
        value: [{ attachment: 1 }],
      },
    });

    expect(result).toEqual([
      {
        name: 'attached_image_1',
        type: 'image',
        value: [{ value: '/api/files/def456.png' }],
      },
    ]);
  });

  it('should throw when an attachment index is missing (empty filename becomes invalid)', async () => {
    const { sut } = createSut();
    const templateDBO = await testingEnvironment.db
      .getCollection('templates')!
      .findOne({ _id: factory.id('Document') });

    const template = MongoTemplateMapper.toDomain(templateDBO as any);

    await expect(
      sut.create({
        template,
        attachments: [{ filename: 'onlyOne.jpg' }] as unknown as Express.Multer.File[],
        propertyAssignment: {
          name: 'attached_image_1',
          value: [{ attachment: 5 }],
        },
      })
    ).rejects.toThrow('Image Property must be a non-empty string.');
  });

  it('throws if the property name does not exist in the template', async () => {
    const { sut } = createSut();
    const templateDBO = await testingEnvironment.db
      .getCollection('templates')!
      .findOne({ _id: factory.id('Document') });

    const template = MongoTemplateMapper.toDomain(templateDBO as any);

    await expect(
      sut.create({
        template,
        propertyAssignment: { name: 'non_existent_property', value: [{ value: 'x.jpg' }] },
      })
    ).rejects.toThrow(PropertyNotFoundError);
  });
});
