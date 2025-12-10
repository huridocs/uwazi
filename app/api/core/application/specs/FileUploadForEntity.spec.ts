/* eslint-disable max-statements */
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';

import { FileUploadForEntityFactory } from 'api/core/infrastructure/factories/FileUploadForEntityFactory';
import { InputFile } from 'api/core/domain/files/InputFile';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';

const f = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
  templates: [f.template('template')],
  entities: [f.entity('entity1', 'template')],
};

const createUseCase = () => {
  const useCase = FileUploadForEntityFactory.default(TransactionManagerFactory.default());
  return { useCase };
};

describe('CreateEntityUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, true);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should upload and save file in db', async () => {
    const { useCase } = createUseCase();

    await useCase.execute({
      entityId: 'entity1',
      uploadedFile: new InputFile(
        {
          fieldname: 'not_important',
          originalname: 'english.pdf',
          encoding: 'utf-8',
          mimetype: 'application/pdf',
          destination: testingEnvironment.testingFilesPath(''),
          filename: 'english.pdf',
          path: '',
          size: 1,
        },
        'document'
      ),
    });
  });
});
