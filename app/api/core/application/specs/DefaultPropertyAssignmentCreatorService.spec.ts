import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { MongoTemplateMapper } from 'api/core/infrastructure/mongodb/template/MongoTemplateMapper';
import { DefaultPropertyAssignmentCreatorService } from '../propertyAssignmentCreatorService/DefaultPropertyAssignmentCreatorService';

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
      factory.property('text', 'text'),
      factory.property('required_text', 'text', { required: true }),
    ]),
  ],
};

describe('DefaultPropertyAssignmentCreatorService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  beforeEach(async () => testingEnvironment.setFixtures(fixtures));

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create a property assignment for a basic text property', async () => {
    const sut = new DefaultPropertyAssignmentCreatorService();
    const templateDBO = await testingEnvironment.db
      .getCollection('templates')!
      .findOne({ _id: factory.id('Document') });

    const template = MongoTemplateMapper.toDomain(templateDBO as any);

    const result = await sut.create({
      template,
      propertyAssignment: { name: 'text', value: [{ value: 'Hello world' }] },
    });

    expect(result).toEqual({
      isTranslatable: true,
      name: 'text',
      type: 'text',
      value: [{ value: 'Hello world' }],
    });
  });

  it('should throw when validateRequired is true and a required text property has no value', async () => {
    const sut = new DefaultPropertyAssignmentCreatorService({ validateRequired: true });
    const templateDBO = await testingEnvironment.db
      .getCollection('templates')!
      .findOne({ _id: factory.id('Document') });

    const template = MongoTemplateMapper.toDomain(templateDBO as any);

    await expect(
      sut.create({
        template,
        propertyAssignment: { name: 'required_text', value: [] },
      })
    ).rejects.toThrow('Text Property is required');
  });

  it('should not throw when validateRequired is false (default) and a required text property has no value', async () => {
    const sut = new DefaultPropertyAssignmentCreatorService();
    const templateDBO = await testingEnvironment.db
      .getCollection('templates')!
      .findOne({ _id: factory.id('Document') });

    const template = MongoTemplateMapper.toDomain(templateDBO as any);

    await expect(
      sut.create({
        template,
        propertyAssignment: { name: 'required_text', value: [] },
      })
    ).resolves.toEqual({
      isTranslatable: true,
      name: 'required_text',
      type: 'text',
      value: [],
    });
  });
});
