import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { tenants } from '#api/tenants/index.js';
import { ImportPredefinedTranslationsJobFactory } from '../../factories/ImportPredefinedTranslationsJobFactory.js';
import { TranslationService } from '#api/core/domain/template/TranslationService.js';

const heartbeat = jest.fn();

const dispatch = async (
  job: ReturnType<typeof ImportPredefinedTranslationsJobFactory.default>,
  languageKey: string
) =>
  job.handleDispatch(heartbeat, { languageKey } as any, {
    namespace: tenants.current().name,
    maxRetries: 3,
    retryCount: 0,
  });

describe('ImportPredefinedTranslationsJob', () => {
  let mockTranslationService: jest.Mocked<Pick<TranslationService, 'importPredefined'>>;

  beforeEach(async () => {
    mockTranslationService = { importPredefined: jest.fn().mockResolvedValue(undefined) };
    await testingEnvironment.setUp({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should call importPredefined with the given language key', async () => {
    const job = ImportPredefinedTranslationsJobFactory.default({
      translationService: mockTranslationService as any,
    });

    await dispatch(job, 'es');

    expect(mockTranslationService.importPredefined).toHaveBeenCalledWith('es');
  });

  describe('when an error is thrown', () => {
    it('should rethrow the error', async () => {
      mockTranslationService.importPredefined.mockRejectedValue(new Error('network failure'));
      const job = ImportPredefinedTranslationsJobFactory.default({
        translationService: mockTranslationService as any,
      });

      await expect(dispatch(job, 'es')).rejects.toThrow('network failure');
    });
  });
});
