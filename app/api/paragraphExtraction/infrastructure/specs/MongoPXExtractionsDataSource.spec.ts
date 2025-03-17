import { ObjectId } from 'mongodb';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';

import { CreateInput } from 'api/paragraphExtraction/domain/PXEntitiesStatusDataSource';
import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';

import {
  mongoPXEntitiesStatusCollection,
  MongoPXEntitiesStatusDataSource,
} from '../MongoPXEntitiesStatusDataSource';

const createSut = () => {
  const transaction = DefaultTransactionManager();
  const connection = getConnection();
  const entitiesStatusDS = new MongoPXEntitiesStatusDataSource(connection, transaction);

  return { entitiesStatusDS };
};

const createExtractionDBO = () => ({
  _id: new ObjectId(),
  extractorId: new ObjectId(),
  entitySharedId: new ObjectId().toString(),
  status: EntityStatus.Queued,
  failedParagraphsCount: 2,
  paragraphsCount: 10,
  successfulParagraphsCount: 0,
});

// eslint-disable-next-line max-statements
describe('MongoPXExtractionsDataSource', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({});
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it.todo('should throw an error if Extraction does not exist');

  it('should create an Extraction if it does not exist', async () => {
    const { entitiesStatusDS } = createSut();

    const input: CreateInput = {
      entitySharedId: new ObjectId().toString(),
      extractorId: new ObjectId().toString(),
    };
    const entityStatus = await entitiesStatusDS.create(input);

    expect(entityStatus).toEqual({
      id: expect.any(String),
      extractorId: input.extractorId,
      entitySharedId: input.entitySharedId,
      status: EntityStatus.Queued,
      paragraphsCount: 0,
      failedParagraphsCount: 0,
      successfulParagraphsCount: 0,
    });
  });

  it('should update Paragraphs count', async () => {
    const extractionCreated = createExtractionDBO();

    await testingEnvironment.setFixtures({
      [mongoPXEntitiesStatusCollection]: [{ ...extractionCreated, paragraphsCount: 0 }],
    });
    const { entitiesStatusDS } = createSut();

    const entityStatus = await entitiesStatusDS.updateParagraphsCount({
      id: extractionCreated._id.toString(),
      count: 20,
    });

    expect(entityStatus).toMatchObject({
      id: extractionCreated._id.toString(),
      paragraphsCount: 20,
    });
  });

  it('should set status as Error', async () => {
    const extractionCreated = createExtractionDBO();

    await testingEnvironment.setFixtures({
      [mongoPXEntitiesStatusCollection]: [extractionCreated],
    });
    const { entitiesStatusDS } = createSut();

    const entityStatus = await entitiesStatusDS.setAsError(extractionCreated._id.toString());

    expect(entityStatus).toMatchObject({
      status: EntityStatus.Error,
    });
  });

  it('should init process', async () => {
    const extractionCreated = createExtractionDBO();

    await testingEnvironment.setFixtures({
      [mongoPXEntitiesStatusCollection]: [extractionCreated],
    });
    const { entitiesStatusDS } = createSut();

    const entityStatus = await entitiesStatusDS.initProcess(extractionCreated._id.toString());

    expect(entityStatus).toMatchObject({
      status: EntityStatus.Processing,
    });
  });

  it('should increment successfulParagraphsCount', async () => {
    const extractionCreated = createExtractionDBO();

    await testingEnvironment.setFixtures({
      [mongoPXEntitiesStatusCollection]: [extractionCreated],
    });
    const { entitiesStatusDS } = createSut();

    const entityStatus = await entitiesStatusDS.incrementSuccess(extractionCreated._id.toString());

    expect(entityStatus).toMatchObject({
      successfulParagraphsCount: 1,
    });
  });

  it('should increment failedParagraphsCount', async () => {
    const extractionCreated = createExtractionDBO();

    await testingEnvironment.setFixtures({
      [mongoPXEntitiesStatusCollection]: [extractionCreated],
    });
    const { entitiesStatusDS } = createSut();

    const entityStatus = await entitiesStatusDS.incrementFail(extractionCreated._id.toString());

    expect(entityStatus).toMatchObject({
      failedParagraphsCount: 3,
    });
  });

  it('should update status to "finished" when all Paragraphs are processed and at least one is successful', async () => {
    const extractionCreated = {
      ...createExtractionDBO(),
      failedParagraphsCount: 9,
    };

    await testingEnvironment.setFixtures({
      [mongoPXEntitiesStatusCollection]: [extractionCreated],
    });
    const { entitiesStatusDS } = createSut();

    const entityStatus = await entitiesStatusDS.incrementSuccess(extractionCreated._id.toString());

    expect(entityStatus).toMatchObject({
      status: EntityStatus.Finished,
    });
  });

  it('should update status to "error" when all Paragraphs are processed and all is unsuccessful', async () => {
    const extractionCreated = {
      ...createExtractionDBO(),
      failedParagraphsCount: 9,
    };

    await testingEnvironment.setFixtures({
      [mongoPXEntitiesStatusCollection]: [extractionCreated],
    });
    const { entitiesStatusDS } = createSut();

    const entityStatus = await entitiesStatusDS.incrementFail(extractionCreated._id.toString());

    expect(entityStatus).toMatchObject({
      status: EntityStatus.Error,
    });
  });

  it('should handle write concurrency', async () => {
    const extractionCreated = {
      ...createExtractionDBO(),
      paragraphsCount: 100,
      failedParagraphsCount: 0,
      successfulParagraphsCount: 0,
    };

    await testingEnvironment.setFixtures({
      [mongoPXEntitiesStatusCollection]: [extractionCreated],
    });

    const { entitiesStatusDS } = createSut();

    const quantity = Array(100).fill(1);

    const promises = quantity.map(async _ =>
      entitiesStatusDS.incrementSuccess(extractionCreated._id.toString())
    );

    await Promise.all(promises);

    const entityStatus = await testingEnvironment.db.getAllFrom(mongoPXEntitiesStatusCollection);

    expect(entityStatus![0]).toMatchObject({
      failedParagraphsCount: 0,
      successfulParagraphsCount: 100,
      paragraphsCount: 100,
      status: EntityStatus.Finished,
    });
  });

  it.todo('should delete an Extraction');
});
