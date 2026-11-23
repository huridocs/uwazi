/* eslint-disable max-statements */
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { MongoTemplateMapper } from '#api/core/infrastructure/mongodb/template/MongoTemplateMapper.js';
import { MediaPropertyAssignmentCreatorService } from '../propertyAssignmentCreatorService/MediaPropertyAssignmentCreatorService.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
  templates: [factory.template('Document', [factory.property('url_media', 'media')])],
};

describe('MediaPropertyAssignmentCreatorService attributes', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  beforeEach(async () => testingEnvironment.setFixtures(fixtures));

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('keeps attributes on a stored media value', async () => {
    const sut = new MediaPropertyAssignmentCreatorService();
    const templateDBO = await testingEnvironment.db
      .getCollection('templates')!
      .findOne({ _id: factory.id('Document') });
    const template = MongoTemplateMapper.toDomain(templateDBO as any);

    const result = await sut.create({
      template,
      propertyAssignment: {
        name: 'url_media',
        value: [{ value: 'https://cdn.example/clip.mp4', attributes: ['ai_generated'] }],
      },
    });

    expect(result).toEqual([
      {
        isTranslatable: true,
        name: 'url_media',
        type: 'media',
        value: [{ value: 'https://cdn.example/clip.mp4', attributes: ['ai_generated'] }],
      },
    ]);
  });
});
