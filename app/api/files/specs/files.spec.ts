import testingDB from '#api/utils/testing_db.js';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { files, UpdateFileError } from '#api/files/files.js';

describe('Files', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({});
  });

  afterAll(async () => testingEnvironment.tearDown());

  it('should not update a File if no longer exist', async () => {
    const promise = files.save({
      _id: testingDB.id(),
      filename: 'any_file_name',
      originalname: 'any_original_name',
      entity: '123',
      language: 'en',
    });

    await expect(promise).rejects.toEqual(new UpdateFileError());

    const [result] = await files.get({});

    expect(result).toBeUndefined();
  });
});
