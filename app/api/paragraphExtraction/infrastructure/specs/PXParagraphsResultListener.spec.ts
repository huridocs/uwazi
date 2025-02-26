import { tenants } from 'api/tenants';
import { PXParagraphsResultListener, ResultMessage } from '../PXParagraphsResultListener';

jest.mock('api/services/tasksmanager/TaskManager');
jest.mock('api/tenants', () => ({
  tenants: { run: jest.fn().mockImplementation((cb: Function, _: string) => cb()) },
}));

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
  },
};

const createSut = () => {
  const extractionService = {
    getParagraphsResult: jest.fn().mockResolvedValue(getParagraphsResultOutput),
  };

  const useCase = {
    execute: jest.fn().mockResolvedValue(null),
  };

  const sut = new PXParagraphsResultListener();
  (sut as any).extractionService = extractionService;
  (sut as any).getUseCase = () => useCase;

  return {
    sut,
    extractionService,
    useCase,
  };
};

describe('PXParagraphsResultListener', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should execute CreateParagraphs use case with correct params', async () => {
    const { sut, extractionService, useCase } = createSut();

    await (sut as any).processResults(resultMessage);

    expect(extractionService.getParagraphsResult).toHaveBeenCalledWith(resultMessage.data_url);
    expect(useCase.execute).toHaveBeenCalledWith(getParagraphsResultOutput);
    expect(tenants.run).toHaveBeenCalledWith(
      expect.anything(),
      getParagraphsResultOutput.extractionId.tenantName
    );
  });

  it('should not execute CreateParagraphs use case when results are not successful', async () => {
    const { sut, extractionService, useCase } = createSut();

    await (sut as any).processResults({ ...resultMessage, success: false, data_url: undefined });

    expect(extractionService.getParagraphsResult).not.toHaveBeenCalled();
    expect(useCase.execute).not.toHaveBeenCalled();
    expect(tenants.run).not.toHaveBeenCalled();
  });
});
