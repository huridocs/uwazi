/* eslint-disable max-statements */
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { PXExtractorsQueryServiceFactory } from 'api/paragraphExtraction/infrastructure/PXExtractorsQueryServiceFactory';
import { MongoPXExtractorsDataSource } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource';
import {
  extractorsQueryFixtures,
  entityFixtures,
  extractor1,
} from './shared/extractorsQueryFixtures';
import { PXGetEntityParagraphs } from '../PXGetEntityParagraphs';

const createFixtures = (): DBFixture => extractorsQueryFixtures;

const setupUseCase = () => {
  const mongoTransactionManager = DefaultTransactionManager();
  const connection = getConnection();

  const extractorsQueryService = PXExtractorsQueryServiceFactory.createDefault({
    connection,
    mongoTransactionManager,
  });
  const settingsDS = DefaultSettingsDataSource(mongoTransactionManager);
  const extractorsDS = new MongoPXExtractorsDataSource(connection, mongoTransactionManager);

  const getEntityParagraphs = new PXGetEntityParagraphs({
    extractorsQueryService,
    settingsDS,
    extractorsDS,
  });

  return getEntityParagraphs;
};

describe('PXGetEntityParagraphs', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should fetch and populate paginated paragraphs for an entity', async () => {
    const getExtractorStatuses = setupUseCase();

    const results = await getExtractorStatuses.execute({
      id: entityFixtures.entity1En.sharedId!.toString(),
      extractorId: extractor1._id.toString(),
      page: { number: 1, size: 2 },
    });

    expect(results.totalRows).toBe(3);
    expect(results.page).toMatchObject({ number: 1, size: 2 });
    expect(results.rows[0]).toMatchObject({
      sharedId: entityFixtures.paragraph2Entity1En.sharedId,
      entities: [
        { _id: entityFixtures.paragraph2Entity1En._id },
        { _id: entityFixtures.paragraph2Entity1Pt._id },
      ],
    });
    expect(results.rows[1]).toMatchObject({
      sharedId: entityFixtures.paragraph1Entity1En.sharedId,
      entities: [
        { _id: entityFixtures.paragraph1Entity1En._id },
        { _id: entityFixtures.paragraph1Entity1Pt._id },
      ],
    });
  });
});
