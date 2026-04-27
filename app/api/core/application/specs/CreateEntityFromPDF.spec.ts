/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { AccessLevel } from '#api/core/domain/entity/AccessLevel.js';
import { PermissionType } from '#api/core/domain/entity/PermissionType.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { User } from '#api/users.v2/model/User.js';
import { CreateEntityFromPDFUseCaseFactory } from '#api/core/infrastructure/factories/CreateEntityFromPDFUseCaseFactory.js';

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
    factory.template('PDF Document', [
      factory.property('description', 'text'),
      factory.property('required_field', 'text', { required: true }),
    ]),
  ],
};

type CreateSutProps = {
  actor?: User;
  targetLanguage?: LanguageISO6391;
};

const createSut = (props: CreateSutProps = {}) => {
  const actor =
    props.actor ??
    User.createFrom({
      _id: new ObjectId(),
      role: 'admin',
      groups: [],
      email: '',
      username: '',
    });

  const { sut } = testingEnvironment.runWithContext(
    () => ({
      sut: CreateEntityFromPDFUseCaseFactory.default({
        targetLanguage: props.targetLanguage ?? 'en',
      }),
    }),
    { actor }
  );

  return { sut };
};

describe('CreateEntityFromPDFUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, true);
  });

  beforeEach(async () => testingEnvironment.setFixtures(fixtures));

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create a basic entity from PDF', async () => {
    const actor = User.createFrom({
      _id: factory.id('user1').toString(),
      username: 'username',
      email: 'email@email.com',
      role: 'collaborator',
    });

    const { sut } = createSut({ actor, targetLanguage: 'en' });

    const entity = await sut.execute({
      templateId: factory.id('PDF Document').toHexString(),
      propertyAssignments: [
        { name: 'title', value: [{ value: 'PDF Entity Title' }] },
        { name: 'description', value: [{ value: 'A description extracted from PDF' }] },
      ],
    });

    const entities = await testingEnvironment.db
      .getCollection('entities')
      ?.find({ sharedId: entity.sharedId })
      .toArray();

    expect(entities).toHaveLength(2); // One per language (en, es)

    const commonProperties = {
      sharedId: expect.any(String),
      template: factory.id('PDF Document'),
      title: 'PDF Entity Title',
      user: factory.id('user1'),
      creationDate: expect.any(Number),
      editDate: expect.any(Number),
      icon: { _id: null, type: 'Empty' },
      permissions: [
        {
          refId: factory.id('user1').toHexString(),
          type: PermissionType.User,
          level: AccessLevel.Write,
        },
      ],
      metadata: expect.objectContaining({
        description: [{ value: 'A description extracted from PDF' }],
      }),
      published: false,
      obsoleteMetadata: [],
    };

    expect(entities).toEqual([
      {
        _id: expect.any(ObjectId),
        language: 'en',
        ...commonProperties,
      },
      {
        _id: expect.any(ObjectId),
        language: 'es',
        ...commonProperties,
      },
    ]);
  });

  it('should NOT validate required properties', async () => {
    const actor = User.createFrom({
      _id: factory.id('user1').toString(),
      username: 'username',
      email: 'email@email.com',
      role: 'collaborator',
    });

    const { sut } = createSut({ actor, targetLanguage: 'en' });

    // The required_field property is marked as required, but we don't provide a value
    // This use case should NOT throw an error - it's a permissive operation for PDF creation
    const entity = await sut.execute({
      templateId: factory.id('PDF Document').toHexString(),
      propertyAssignments: [
        { name: 'title', value: [{ value: 'PDF without required field' }] },
        // Intentionally omitting required_field
      ],
    });

    expect(entity).toBeDefined();
    expect(entity.sharedId).toBeDefined();
  });
});
