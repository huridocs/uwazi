import db, { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';

const setupTestingEnviroment = async (data: DBFixture, index?: string) =>
  testingEnvironment.setUp(
    {
      ...data,
      settings: [
        {
          _id: db.id(),
          languages: [
            { key: 'en', label: 'EN', default: true },
            { key: 'es', label: 'ES' },
          ],
        },
      ],
    },
    index
  );

export { setupTestingEnviroment };
