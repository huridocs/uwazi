/* eslint-disable max-statements */
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { PXExtractorsQueryServiceFactory } from 'api/paragraphExtraction/infrastructure/PXExtractorsQueryServiceFactory';
import { GetExtractorStatusesInput } from 'api/paragraphExtraction/domain/PXExtractorsQueryService';
import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';

import { extractorsQueryFixtures, extractor1 } from './shared/extractorsQueryFixtures';
import { PXGetExtractorStatuses } from '../PXGetExtractorStatuses';

const createFixtures = (): DBFixture => extractorsQueryFixtures;

const setupUseCase = () => {
  const mongoTransactionManager = TransactionManagerFactory.default();
  const connection = getConnection();

  const settingsDS = SettingsDataSourceFactory.default(mongoTransactionManager);
  const filesDS = DefaultFilesDataSource(mongoTransactionManager);

  const extractorsQueryService = PXExtractorsQueryServiceFactory.createDefault({
    connection,
    transactionManager: mongoTransactionManager,
  });

  const getExtractorStatuses = new PXGetExtractorStatuses({
    extractorsQueryService,
    settingsDS,
    filesDS,
  });

  return getExtractorStatuses;
};

describe('PXGetExtractorStatuses', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should fetch and populate entity statuses for an extractor (with languages and paragraph count)', async () => {
    const getExtractorStatuses = setupUseCase();

    const input: GetExtractorStatusesInput = {
      id: extractor1._id.toString(),
      language: 'pt',
    };

    const results = await getExtractorStatuses.execute(input);

    expect(results.page).toMatchObject({ number: 1, size: 10 });
    expect(results.totalRows).toBe(8);
    expect(results.rows[0]).toMatchObject({
      entity: { title: 'entity1', language: 'pt' },
      availableFileLanguages: ['en', 'pt'],
      paragraphsCount: 3,
      status: { status: EntityStatus.Processed },
    });
    expect(results.rows[1]).toMatchObject({
      entity: { title: 'entity2', language: 'pt' },
      availableFileLanguages: [],
      paragraphsCount: 0,
      status: { status: EntityStatus.New },
    });
    expect(results.rows[3]).toMatchObject({
      entity: { title: 'entity5', language: 'pt' },
      availableFileLanguages: ['en'],
      paragraphsCount: 1,
      status: { status: EntityStatus.Processing },
    });
  });

  it('should allow filtering and paginating the results', async () => {
    const getExtractorStatuses = setupUseCase();

    const input: GetExtractorStatusesInput = {
      id: extractor1._id.toString(),
      language: 'pt',
      page: { number: 1, size: 3 },
      filter: { status: [EntityStatus.New, EntityStatus.Processing] },
    };

    const resultsPg1 = await getExtractorStatuses.execute(input);

    expect(resultsPg1.page).toMatchObject({ number: 1, size: 3 });
    expect(resultsPg1.totalRows).toBe(4);
    expect(resultsPg1.rows[0]).toMatchObject({
      availableFileLanguages: [],
      entity: { title: 'entity2', language: 'pt' },
      status: { status: EntityStatus.New },
    });
    expect(resultsPg1.rows[1]).toMatchObject({
      availableFileLanguages: [],
      entity: { title: 'entity4', language: 'pt' },
      status: { status: EntityStatus.New },
    });
    expect(resultsPg1.rows[2]).toMatchObject({
      availableFileLanguages: ['en'],
      entity: { title: 'entity5', language: 'pt' },
      status: { status: EntityStatus.Processing },
    });

    input.page!.number = 2;

    const resultsPg2 = await getExtractorStatuses.execute(input);

    expect(resultsPg2.page).toMatchObject({ number: 2, size: 3 });
    expect(resultsPg2.totalRows).toBe(4);
    expect(resultsPg2.rows.length).toBe(1);
    expect(resultsPg2.rows[0]).toMatchObject({
      availableFileLanguages: [],
      entity: { title: 'entity9', language: 'pt' },
      status: { status: EntityStatus.New },
    });
  });
});
