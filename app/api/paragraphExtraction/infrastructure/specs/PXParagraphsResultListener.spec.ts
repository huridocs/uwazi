import { ObjectId } from 'mongodb';
import { tenants } from 'api/tenants';
import { PXExtractionKey } from 'api/paragraphExtraction/domain/PXExtractionKey';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';

import { PXParagraphsResultListener, ResultMessage } from '../PXParagraphsResultListener';
import { mongoPXEntitiesStatusCollection } from '../MongoPXEntitiesStatusDataSource';
import { MongoPXEntityStatus } from '../MongoPXEntityStatus';

jest.mock('api/services/tasksmanager/TaskManager');

jest.spyOn(tenants, 'run');

const extractionDBO: MongoPXEntityStatus = {
  _id: new ObjectId(),
  entitySharedId: 'any_entity_shared_id',
  extractorId: new ObjectId(),
  status: EntityStatus.Processing,
};

const extractionKey = PXExtractionKey.create({
  entityStatusId: extractionDBO._id.toString(),
  tenantName: 'any_tenant_name',
  userId: 'any_user_id',
});

const resultMessage: ResultMessage = {
  success: true,
  key: extractionKey.key,
  data_url: 'data_url',
  error_message: '',
  xmls: [],
};

const getParagraphsResultOutput = {
  extractionKey,
};

const createSut = () => {
  const extractionService = {
    getParagraphsResult: jest.fn().mockResolvedValue(getParagraphsResultOutput),
  };

  const useCase = {
    execute: jest.fn(),
  };

  const listener = new PXParagraphsResultListener();

  (listener as any).extractionService = extractionService;
  (listener as any).getUseCase = () => useCase;
  (listener as any).setCurrentUser = jest.fn().mockResolvedValue(null);

  return {
    listener,
    processResults: (listener as any).processResults.bind(listener),
    extractionService,
    useCase,
  };
};

describe('PXParagraphsResultListener', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({
      [mongoPXEntitiesStatusCollection]: [extractionDBO],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
    jest.resetAllMocks();
  });

  it('should execute CreateParagraphs use case with correct params', async () => {
    const { listener, processResults, extractionService, useCase } = createSut();

    await processResults(resultMessage);

    expect((listener as any).setCurrentUser).toHaveBeenCalledWith(
      getParagraphsResultOutput.extractionKey.userId
    );
    expect(extractionService.getParagraphsResult).toHaveBeenCalledWith(resultMessage.data_url);
    expect(useCase.execute).toHaveBeenCalledWith(getParagraphsResultOutput);
    expect(tenants.run).toHaveBeenCalledWith(expect.any(Function), extractionKey.tenantName);
  });

  it('should not execute CreateParagraphs use case when results are not successful', async () => {
    const { processResults, extractionService, useCase } = createSut();

    const promise = processResults({
      ...resultMessage,
      success: false,
      data_url: undefined,
    });

    await expect(promise).rejects.toThrow();
    expect(extractionService.getParagraphsResult).not.toHaveBeenCalled();
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('should set Extraction status to "error" when the operation failed', async () => {
    const { processResults } = createSut();

    const promise = processResults({
      ...resultMessage,
      success: false,
      data_url: undefined,
    });

    await expect(promise).rejects.toThrow();

    const extractions = await testingEnvironment.db.getAllFrom(mongoPXEntitiesStatusCollection);

    expect(extractions).toMatchObject([
      {
        _id: extractionDBO._id,
        status: EntityStatus.Error,
      },
    ]);
  });
});
