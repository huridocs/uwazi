/* eslint-disable max-statements */
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';

import { FileUploadForEntityFactory } from 'api/core/infrastructure/factories/FileUploadForEntityFactory';
import { InputFile } from 'api/core/domain/files/InputFile';

const f = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { default: true, key: 'en', label: 'English' },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],

  entities: [f.entity('entity1')],
};

const createUseCase = () => {
  const useCase = FileUploadForEntityFactory.default();
  return { useCase };
};

describe('CreateEntityUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, true);
  });

  beforeEach(async () => testingEnvironment.setFixtures(fixtures));

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create an Entity', async () => {
    const { useCase } = createUseCase();

    await useCase.execute({
      entityId: 'entity1',
      uploadedFile: new InputFile(
        {
          fieldname: 'not_important',
          originalname: 'english.pdf',
          encoding: 'utf-8',
          mimetype: 'application/pdf',
          destination: '',
          filename: 'english.pdf',
          path: '',
          size: 1,
        },
        'document'
      ),
    });
  });
});
