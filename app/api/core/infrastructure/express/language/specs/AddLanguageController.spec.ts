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
    useCaseExecuteSpy.mockResolvedValue([]);
    jest.spyOn(tenants, 'current').mockReturnValue({} as any);
    jest.spyOn(AddLanguageUseCaseFactory, 'default').mockReturnValue({
      execute: useCaseExecuteSpy,
    } as any);
    jest.spyOn(translations, 'get').mockResolvedValue([{ locale: 'es', contexts: [] }] as any);
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

  it('should call use case with parsed languages', async () => {
    const languages = [{ key: 'es', label: 'Spanish' }];
    const { sut, response } = createSut(languages);

    await sut.handleAsync();

    expect(useCaseExecuteSpy).toHaveBeenCalledWith({ languages });
    expect(response.sendStatus).toHaveBeenCalledWith(204);
  });

  it('should emit translationsChange for each language and updateSettings after execution', async () => {
    const fakeTranslations = { locale: 'es', contexts: [] };
    const fakeSettings = { languages: [{ key: 'es', label: 'Spanish' }] };
    jest.spyOn(translations, 'get').mockResolvedValue([fakeTranslations] as any);
    jest.spyOn(settings, 'get').mockResolvedValue(fakeSettings as any);

    const languages = [{ key: 'es', label: 'Spanish' }];
    const { sut, emitToCurrentTenant } = createSut(languages);

    await sut.handleAsync();

    expect(emitToCurrentTenant).toHaveBeenCalledWith('translationsChange', fakeTranslations);
    expect(emitToCurrentTenant).toHaveBeenCalledWith('updateSettings', fakeSettings);
  });

  it('should emit translationsChange for each language when multiple languages are added', async () => {
    jest
      .spyOn(translations, 'get')
      .mockResolvedValueOnce([{ locale: 'es', contexts: [] }] as any)
      .mockResolvedValueOnce([{ locale: 'fr', contexts: [] }] as any);

    const languages = [
      { key: 'es', label: 'Spanish' },
      { key: 'fr', label: 'French' },
    ];
    const { sut, emitToCurrentTenant } = createSut(languages);

    await sut.handleAsync();

    expect(emitToCurrentTenant).toHaveBeenCalledWith(
      'translationsChange',
      expect.objectContaining({ locale: 'es' })
    );
    expect(emitToCurrentTenant).toHaveBeenCalledWith(
      'translationsChange',
      expect.objectContaining({ locale: 'fr' })
    );
  });
});
