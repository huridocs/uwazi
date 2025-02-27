import { tenants } from 'api/tenants';

import { PXParagraphsResultListener, ResultMessage } from '../PXParagraphsResultListener';

jest.mock('api/services/tasksmanager/TaskManager');

const resultMessage: ResultMessage = {
  success: true,
  key: 'key',
  data_url: 'data_url',
  error_message: '',
  xmls: [],
};

const getParagraphsResultOutput = {
  extractionId: {
    tenantName: 'tenantName',
    userId: 'any_user_id',
  },
};

let tenantUsed: string;

const createSut = () => {
  const extractionService = {
    getParagraphsResult: jest.fn().mockResolvedValue(getParagraphsResultOutput),
  };

  const useCase = {
    execute: jest.fn().mockImplementation(() => {
      tenantUsed = tenants.current().name;
    }),
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
  beforeAll(async () => {
    tenants.add({ name: 'tenantName' });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should execute CreateParagraphs use case with correct params', async () => {
    const { listener, processResults, extractionService, useCase } = createSut();

    await processResults(resultMessage);

    expect((listener as any).setCurrentUser).toHaveBeenCalledWith(
      getParagraphsResultOutput.extractionId.userId
    );
    expect(extractionService.getParagraphsResult).toHaveBeenCalledWith(resultMessage.data_url);
    expect(useCase.execute).toHaveBeenCalledWith(getParagraphsResultOutput);
    expect(tenantUsed).toBe(getParagraphsResultOutput.extractionId.tenantName);
  });

  it('should not execute CreateParagraphs use case when results are not successful', async () => {
    const { processResults, extractionService, useCase } = createSut();

    await processResults({
      ...resultMessage,
      success: false,
      data_url: undefined,
    });

    expect(extractionService.getParagraphsResult).not.toHaveBeenCalled();
    expect(useCase.execute).not.toHaveBeenCalled();
  });
});
