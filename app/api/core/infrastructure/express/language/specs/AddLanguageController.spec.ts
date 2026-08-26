import type { Request, Response } from 'express';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { tenants } from '#api/tenants/index.js';
import { AddLanguageUseCaseFactory } from '#api/core/infrastructure/factories/AddLanguageUseCaseFactory.js';
import { AddLanguageUseCase } from '#api/core/application/AddLanguage.js';
import { SettingsQueryServiceFactory } from '#api/core/infrastructure/factories/SettingsQueryServiceFactory.js';
import { TranslationsQueryServiceFactory } from '#api/core/infrastructure/factories/TranslationsQueryServiceFactory.js';
import { TranslationsQueryService } from '#api/core/application/translation/TranslationsQueryService.js';
import { AddLanguageController } from '../AddLanguageController.js';

const createSut = (body?: unknown) => {
  const emitToCurrentTenant = jest.fn();
  const request = TestUtils.mockClass<Request>({
    body: body ?? [],
    sockets: { emitToCurrentTenant },
  });
  const response = TestUtils.mockClass<Response>({
    sendStatus: jest.fn(),
  });

  const sut = new AddLanguageController({ request, response });

  return { sut, request, response, emitToCurrentTenant };
};

describe('AddLanguageController', () => {
  let useCaseExecuteSpy: jest.Mock;
  const getLegacySpy = jest.fn().mockResolvedValue([]);

  beforeEach(() => {
    useCaseExecuteSpy = jest.fn();
    getLegacySpy.mockReset().mockResolvedValue([]);
    jest.spyOn(tenants, 'current').mockReturnValue({} as any);
    jest.spyOn(AddLanguageUseCaseFactory, 'default').mockReturnValue(
      TestUtils.mockClass<AddLanguageUseCase>({
        execute: useCaseExecuteSpy,
      })
    );
    jest.spyOn(TranslationsQueryServiceFactory, 'default').mockReturnValue(
      TestUtils.mockClass<TranslationsQueryService>({
        getLegacy: getLegacySpy,
      })
    );
    jest.spyOn(SettingsQueryServiceFactory, 'default').mockReturnValue({
      get: jest.fn().mockResolvedValue({ languages: [] }),
    } as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should throw when body is not an array', async () => {
    const { sut } = createSut({ key: 'en', label: 'English' });

    await expect(sut.handleAsync()).rejects.toThrow();
  });

  it('should throw when a language item is missing required fields', async () => {
    const { sut } = createSut([{ key: 'en' }]);

    await expect(sut.handleAsync()).rejects.toThrow();
  });

  it('should call use case with all requested languages', async () => {
    useCaseExecuteSpy.mockResolvedValue([]);
    const languages = [{ key: 'es', label: 'Spanish' }];
    const { sut, response } = createSut(languages);

    await sut.handleAsync();

    expect(useCaseExecuteSpy).toHaveBeenCalledWith({ languages });
    expect(response.sendStatus).toHaveBeenCalledWith(204);
  });

  it('should not emit translationsChange when execute returns no added languages', async () => {
    useCaseExecuteSpy.mockResolvedValue([]);
    const { sut, emitToCurrentTenant, response } = createSut([{ key: 'es', label: 'Spanish' }]);

    await sut.handleAsync();

    expect(getLegacySpy).not.toHaveBeenCalled();
    expect(emitToCurrentTenant).not.toHaveBeenCalledWith('translationsChange', expect.anything());
    expect(emitToCurrentTenant).toHaveBeenCalledWith('updateSettings', expect.anything());
    expect(response.sendStatus).toHaveBeenCalledWith(204);
  });

  it('should emit translationsChange only for languages returned by execute', async () => {
    const addedLanguage = { key: 'es', label: 'Spanish' };
    useCaseExecuteSpy.mockResolvedValue([addedLanguage]);
    const fakeTranslations = { locale: 'es', contexts: [] };
    getLegacySpy.mockResolvedValue([fakeTranslations]);

    // request body contains two languages but execute only returns one (the new one)
    const { sut, emitToCurrentTenant } = createSut([
      { key: 'es', label: 'Spanish' },
      { key: 'en', label: 'English' }, // already installed, not returned by use case
    ]);

    await sut.handleAsync();

    expect(getLegacySpy).toHaveBeenCalledTimes(1);
    expect(getLegacySpy).toHaveBeenCalledWith({ locale: 'es' });
    expect(emitToCurrentTenant).toHaveBeenCalledWith('translationsChange', fakeTranslations);
    expect(emitToCurrentTenant).not.toHaveBeenCalledWith(
      'translationsChange',
      expect.objectContaining({ locale: 'en' })
    );
  });

  it('should emit updateSettings after execution', async () => {
    const fakeSettings = { languages: [{ key: 'es', label: 'Spanish' }] };
    useCaseExecuteSpy.mockResolvedValue([]);
    const getSettings = jest.fn().mockResolvedValue(fakeSettings);
    jest.spyOn(SettingsQueryServiceFactory, 'default').mockReturnValue({
      get: getSettings,
    } as any);

    const { sut, emitToCurrentTenant } = createSut([{ key: 'es', label: 'Spanish' }]);

    await sut.handleAsync();

    expect(emitToCurrentTenant).toHaveBeenCalledWith('updateSettings', fakeSettings);
  });
});
