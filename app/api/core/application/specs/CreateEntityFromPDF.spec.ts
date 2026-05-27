import { ObjectId } from 'mongodb';

import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { CreateEntityFromPDFUseCaseFactory } from '#api/core/infrastructure/factories/CreateEntityFromPDFUseCaseFactory.js';
import { User } from '#api/users.v2/model/User.js';
import { GrantType } from '#api/core/domain/entityAccessPolicy/GrantType.js';
import { AccessLevel } from '#api/core/domain/entityAccessPolicy/AccessLevel.js';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { CreateEntityFromPDFUseCaseInput } from '../CreateEntityFromPDF.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { ProcessingPDF } from '#api/core/domain/files/ProcessingPDF.js';
import { CannotCreateEntityFromNonPDFError } from '#api/core/domain/entity/errors.js';

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
    factory.template('Document_1', []),
    factory.template('Document_2', [
      factory.property('required_field', 'text', { required: true }),
    ]),
  ],
};

const createSut = () => {
  const actor = User.createFrom({
    _id: new ObjectId(),
    role: 'admin',
    groups: [],
    email: '',
    username: '',
  });

  return testingEnvironment.runWithContext(
    () => {
      const fileStorage = FileStorageFactory.forTests();

      return {
        sut: CreateEntityFromPDFUseCaseFactory.default({
          targetLanguage: 'en',
          filesService: FilesServiceFactory.default({ fileStorage }),
        }),
        actor,
        fileStorage,
      };
    },
    { actor }
  );
};

describe('CreateEntityFromPDFUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, true);
  });

  beforeEach(async () => testingEnvironment.setFixtures(fixtures));

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create a entity from a PDF file', async () => {
    const { sut, actor } = createSut();

    const input: CreateEntityFromPDFUseCaseInput = {
      templateId: factory.id('Document_1').toHexString(),
      inputFile: new InputFile(
        {
          fieldname: 'file',
          originalname: 'PDF Entity Title.pdf',
          filename: 'PDF Entity Title.pdf',
          mimetype: 'application/pdf',
          size: 1024,
          destination: '/tmp/uploads',
          encoding: '7-bit',
          path: '/tmp/uploads/PDF Entity Title.pdf',
        },
        'document'
      ),
    };

    const entity = await sut.execute(input);

    const entities = await testingEnvironment.db
      .getCollection('entities')
      ?.find({ sharedId: entity.sharedId })
      .toArray();

    const commonProperties = {
      sharedId: expect.any(String),
      template: factory.id('Document_1'),
      title: input.inputFile.metadata.originalname,
      user: new ObjectId(actor._id),
      creationDate: expect.any(Number),
      editDate: expect.any(Number),
      icon: { _id: null, type: 'Empty' },
      permissions: [
        {
          refId: actor._id,
          type: GrantType.User,
          level: AccessLevel.Write,
        },
      ],
      metadata: {},
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

  it('should create PDF along with the entity', async () => {
    const { sut, fileStorage } = createSut();

    const input: CreateEntityFromPDFUseCaseInput = {
      templateId: factory.id('Document_1').toHexString(),
      inputFile: new InputFile(
        {
          fieldname: 'file',
          originalname: 'PDF Entity Title.pdf',
          filename: 'PDF Entity Title.pdf',
          mimetype: 'application/pdf',
          size: 1024,
          destination: '/tmp/uploads',
          encoding: '7-bit',
          path: '/tmp/uploads/PDF Entity Title.pdf',
        },
        'document'
      ),
    };

    const entity = await sut.execute(input);

    const files = await testingEnvironment.db
      .getCollection('files')
      ?.find({ entity: entity.sharedId })
      .toArray();

    expect(fileStorage.storeFile).toHaveBeenCalledWith(expect.any(ProcessingPDF));

    expect(files).toEqual([
      {
        _id: expect.any(ObjectId),
        originalname: 'PDF Entity Title.pdf',
        filename: 'PDF Entity Title.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: expect.any(Number),
        entity: entity.sharedId,
        status: 'processing',
        type: 'document',
      },
    ]);
  });

  it('should not validate for required properties in the template', async () => {
    const { sut } = createSut();

    const input: CreateEntityFromPDFUseCaseInput = {
      templateId: factory.id('Document_2').toHexString(),
      inputFile: new InputFile(
        {
          fieldname: 'file',
          originalname: 'PDF Entity Title.pdf',
          filename: 'PDF Entity Title.pdf',
          mimetype: 'application/pdf',
          size: 1024,
          destination: '/tmp/uploads',
          encoding: '7-bit',
          path: '/tmp/uploads/PDF Entity Title.pdf',
        },
        'document'
      ),
    };

    const entity = await sut.execute(input);

    const entities = await testingEnvironment.db
      .getCollection('entities')
      ?.find({ sharedId: entity.sharedId })
      .toArray();

    expect(entities).toHaveLength(2);
  });

  it('should throw when File is not a PDF', async () => {
    const { sut } = createSut();

    const input: CreateEntityFromPDFUseCaseInput = {
      templateId: factory.id('Document_2').toHexString(),
      inputFile: new InputFile(
        {
          fieldname: 'file',
          originalname: 'PDF Entity Title.pdf',
          filename: 'PDF Entity Title.pdf',
          mimetype: 'application/pdf',
          size: 1024,
          destination: '/tmp/uploads',
          encoding: '7-bit',
          path: '/tmp/uploads/PDF Entity Title.pdf',
        },
        'attachment'
      ),
    };

    await expect(sut.execute(input)).rejects.toThrow(CannotCreateEntityFromNonPDFError);
  });
});
