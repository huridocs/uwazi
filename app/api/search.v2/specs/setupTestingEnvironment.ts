import db, { DBFixture } from '../utils/testing_db.js';
import { testingEnvironment } from '../utils/testingEnvironment.js';

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
