import { ObjectId } from 'mongodb';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';

import {
  CreateInput,
  InitProcessInput,
} from 'api/paragraphExtraction/domain/PXExtractionDataSource';
import { ExtractionStatus } from 'api/paragraphExtraction/domain/PXExtraction';

import {
  mongoPXExtractionsCollection,
  MongoPXExtractionsDataSource,
} from '../MongoPXExtractionsDataSource';

const createSut = () => {
  const transaction = DefaultTransactionManager();
  const connection = getConnection();
  const extractionsDS = new MongoPXExtractionsDataSource(connection, transaction);

  return { extractionsDS };
};

const createExtractionDBO = () => ({
  _id: new ObjectId(),
  extractorId: new ObjectId(),
  entitySharedId: new ObjectId().toString(),
  status: ExtractionStatus.Queued,
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
    const { extractionsDS } = createSut();

    const input: CreateInput = {
      entitySharedId: new ObjectId().toString(),
      extractorId: new ObjectId().toString(),
    };
    const extraction = await extractionsDS.create(input);

    expect(extraction).toEqual({
      id: expect.any(String),
      extractorId: input.extractorId,
      entitySharedId: input.entitySharedId,
      status: ExtractionStatus.Queued,
      paragraphsCount: 0,
      failedParagraphsCount: 0,
      successfulParagraphsCount: 0,
    });
  });

  it('should update Paragraphs count', async () => {
    const extractionCreated = createExtractionDBO();

    await testingEnvironment.setFixtures({
      [mongoPXExtractionsCollection]: [{ ...extractionCreated, paragraphsCount: 0 }],
    });
    const { extractionsDS } = createSut();

    const extraction = await extractionsDS.updateParagraphsCount({
      id: extractionCreated._id.toString(),
      count: 20,
    });

    expect(extraction).toMatchObject({
      id: extractionCreated._id.toString(),
      paragraphsCount: 20,
    });
  });

  it('should set status as Error', async () => {
    const extractionCreated = createExtractionDBO();

    await testingEnvironment.setFixtures({ [mongoPXExtractionsCollection]: [extractionCreated] });
    const { extractionsDS } = createSut();

    const extraction = await extractionsDS.setAsError(extractionCreated._id.toString());

    expect(extraction).toMatchObject({
      status: ExtractionStatus.Error,
    });
  });

  it('should init process', async () => {
    const extractionCreated = createExtractionDBO();

    await testingEnvironment.setFixtures({ [mongoPXExtractionsCollection]: [extractionCreated] });
    const { extractionsDS } = createSut();

    const input: InitProcessInput = {
      entitySharedId: extractionCreated.entitySharedId,
      extractorId: extractionCreated.extractorId.toString(),
    };

    const extraction = await extractionsDS.initProcess(input);

    expect(extraction).toMatchObject({
      status: ExtractionStatus.Processing,
    });
  });

  it('should increment successfulParagraphsCount', async () => {
    const extractionCreated = createExtractionDBO();

    await testingEnvironment.setFixtures({ [mongoPXExtractionsCollection]: [extractionCreated] });
    const { extractionsDS } = createSut();

    const extraction = await extractionsDS.incrementSuccess(extractionCreated._id.toString());

    expect(extraction).toMatchObject({
      successfulParagraphsCount: 1,
    });
  });

  it('should increment failedParagraphsCount', async () => {
    const extractionCreated = createExtractionDBO();

    await testingEnvironment.setFixtures({ [mongoPXExtractionsCollection]: [extractionCreated] });
    const { extractionsDS } = createSut();

    const extraction = await extractionsDS.incrementFail(extractionCreated._id.toString());

    expect(extraction).toMatchObject({
      failedParagraphsCount: 3,
    });
  });

  it('should update status to "finished" when all Paragraphs are processed and at least one is successful', async () => {
    const extractionCreated = {
      ...createExtractionDBO(),
      failedParagraphsCount: 9,
    };

    await testingEnvironment.setFixtures({ [mongoPXExtractionsCollection]: [extractionCreated] });
    const { extractionsDS } = createSut();

    const extraction = await extractionsDS.incrementSuccess(extractionCreated._id.toString());

    expect(extraction).toMatchObject({
      status: ExtractionStatus.Finished,
    });
  });

  it('should update status to "error" when all Paragraphs are processed and all is unsuccessful', async () => {
    const extractionCreated = {
      ...createExtractionDBO(),
      failedParagraphsCount: 9,
    };

    await testingEnvironment.setFixtures({
      [mongoPXExtractionsCollection]: [extractionCreated],
    });
    const { extractionsDS } = createSut();

    const extraction = await extractionsDS.incrementFail(extractionCreated._id.toString());

    expect(extraction).toMatchObject({
      status: ExtractionStatus.Error,
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
      [mongoPXExtractionsCollection]: [extractionCreated],
    });

    const { extractionsDS } = createSut();

    const quantity = Array(100).fill(1);

    const promises = quantity.map(async _ =>
      extractionsDS.incrementSuccess(extractionCreated._id.toString())
    );

    await Promise.all(promises);

    const extraction = await testingEnvironment.db.getAllFrom(mongoPXExtractionsCollection);

    expect(extraction![0]).toMatchObject({
      failedParagraphsCount: 0,
      successfulParagraphsCount: 100,
      paragraphsCount: 100,
      status: ExtractionStatus.Finished,
    });
  });

  it.todo('should delete an Extraction');
});
