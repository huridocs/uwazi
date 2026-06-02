import { TestUtils } from '#api/common.v2/utils/Test.js';
import type { Request, Response } from 'express';
import { tenants } from '#api/tenants/index.js';
import { AddLanguageUseCaseFactory } from '#api/core/infrastructure/factories/AddLanguageUseCaseFactory.js';
import settings from '#api/settings/index.js';
import translations from '#api/i18n/translations.js';
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
  const useCaseExecuteSpy: jest.SpyInstance = jest.fn();

  beforeEach(() => {
    jest.spyOn(tenants, 'current').mockReturnValue({} as any);
    jest.spyOn(AddLanguageUseCaseFactory, 'default').mockReturnValue({
      execute: useCaseExecuteSpy,
    } as any);
    jest.spyOn(translations, 'get').mockResolvedValue([] as any);
    jest.spyOn(settings, 'get').mockResolvedValue({ languages: [] } as any);
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

    expect(translations.get).not.toHaveBeenCalled();
    expect(emitToCurrentTenant).not.toHaveBeenCalledWith('translationsChange', expect.anything());
    expect(emitToCurrentTenant).toHaveBeenCalledWith('updateSettings', expect.anything());
    expect(response.sendStatus).toHaveBeenCalledWith(204);
  });

  it('should emit translationsChange only for languages returned by execute', async () => {
    const addedLanguage = { key: 'es', label: 'Spanish' };
    useCaseExecuteSpy.mockResolvedValue([addedLanguage]);
    const fakeTranslations = { locale: 'es', contexts: [] };
    jest.spyOn(translations, 'get').mockResolvedValue([fakeTranslations] as any);

    // request body contains two languages but execute only returns one (the new one)
    const { sut, emitToCurrentTenant } = createSut([
      { key: 'es', label: 'Spanish' },
      { key: 'en', label: 'English' }, // already installed, not returned by use case
    ]);

    await sut.handleAsync();

    expect(translations.get).toHaveBeenCalledTimes(1);
    expect(translations.get).toHaveBeenCalledWith({ locale: 'es' });
    expect(emitToCurrentTenant).toHaveBeenCalledWith('translationsChange', fakeTranslations);
    expect(emitToCurrentTenant).not.toHaveBeenCalledWith(
      'translationsChange',
      expect.objectContaining({ locale: 'en' })
    );
  });

  it('should emit updateSettings after execution', async () => {
    const fakeSettings = { languages: [{ key: 'es', label: 'Spanish' }] };
    useCaseExecuteSpy.mockResolvedValue([]);
    jest.spyOn(settings, 'get').mockResolvedValue(fakeSettings as any);

    const { sut, emitToCurrentTenant } = createSut([{ key: 'es', label: 'Spanish' }]);

    await sut.handleAsync();

    expect(emitToCurrentTenant).toHaveBeenCalledWith('updateSettings', fakeSettings);
  });
});
