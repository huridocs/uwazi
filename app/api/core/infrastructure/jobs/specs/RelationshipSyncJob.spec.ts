/* eslint-disable max-statements */
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import relationships from '#api/relationships/index.js';
import { tenants } from '#api/tenants/index.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { EntityNotFoundError } from '#api/core/application/errors.js';
import { RelationshipSyncJob } from '../RelationshipSyncJob.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { default: true, key: 'en', label: 'English' },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],

  templates: [
    factory.template(
      'Document',
      [factory.property('text', 'text'), factory.property('numeric', 'numeric')],
      { default: true }
    ),
  ],

  entities: [
    ...factory.entityInMultipleLanguages(['en', 'es'], 'entity_1', 'Document', {
      text: [{ value: 'Some text' }],
      numeric: [{ value: 42 }],
    }),
  ],
};

const createSut = () => {
  const saveEntityBasedReferencesSpy = jest
    .spyOn(relationships, 'saveEntityBasedReferences')
    .mockResolvedValue();

  const sut = new RelationshipSyncJob({ relationships });

  return { sut, saveEntityBasedReferencesSpy };
};

describe('RelationshipSyncJob', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, true);
  });

  beforeAll(async () => {
    await testingEnvironment.setFixtures(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should call relationships.saveEntityBasedReferences with the correct params', async () => {
    const { sut, saveEntityBasedReferencesSpy } = createSut();
    const templateId = factory.id('Document');

    await testingEnvironment.runWithContext(async () => {
      await sut.handleDispatch(async () => Promise.resolve(), {
        sharedId: 'entity_1',
        targetLanguage: 'en',
        templateId: templateId.toHexString(),
        tenantName: tenants.current().name,
        userId: permissionsContext.getUserInContext()!._id?.toString()!,
      });
    });

    const template = await testingEnvironment.db
      .getCollection('templates')
      ?.findOne({ _id: templateId });
    const entity = await testingEnvironment.db
      .getCollection('entities')
      ?.findOne({ sharedId: 'entity_1', language: 'en' });

    expect(saveEntityBasedReferencesSpy).toHaveBeenCalledWith(entity, 'en', template);
  });

  it('should throw a NonRetryableJobError when entity does not exist', async () => {
    jest.clearAllMocks();
    const { sut, saveEntityBasedReferencesSpy } = createSut();
    const templateId = factory.id('Document');

    await expect(
      testingEnvironment.runWithContext(async () =>
        sut.handleDispatch(async () => Promise.resolve(), {
          sharedId: 'non_existent_entity',
          targetLanguage: 'en',
          templateId: templateId.toHexString(),
          tenantName: tenants.current().name,
          userId: permissionsContext.getUserInContext()!._id?.toString()!,
        })
      )
    ).rejects.toThrow(new NonRetryableJobError(new EntityNotFoundError('non_existent_entity')));

    expect(saveEntityBasedReferencesSpy).not.toHaveBeenCalled();
  });
});
