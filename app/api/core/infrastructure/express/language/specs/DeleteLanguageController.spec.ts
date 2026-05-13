import { TestUtils } from '#api/common.v2/utils/Test.js';
import type { Request, Response } from 'express';
import { tenants } from '#api/tenants/index.js';
import { DeleteLanguageUseCaseFactory } from '#api/core/infrastructure/factories/DeleteLanguageUseCaseFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import settings from '#api/settings/index.js';
import { DeleteLanguageController } from '../DeleteLanguageController.js';

const createSut = (query?: Record<string, string>) => {
  const emitToCurrentTenant = jest.fn();
  const request = TestUtils.mockClass<Request>({
    query: query ?? {},
    sockets: { emitToCurrentTenant },
  });
  const response = TestUtils.mockClass<Response>({
    sendStatus: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  });

  const sut = new DeleteLanguageController({ request, response });

  return { sut, request, response, emitToCurrentTenant };
};

describe('DeleteLanguageController', () => {
  const useCaseExecuteSpy: jest.SpyInstance = jest.fn();
  const settingsGetSpy: jest.SpyInstance = jest.fn();

  beforeEach(() => {
    useCaseExecuteSpy.mockResolvedValue(undefined);
    jest.spyOn(tenants, 'current').mockReturnValue({} as any);

    jest.spyOn(DeleteLanguageUseCaseFactory, 'default').mockReturnValue({
      execute: useCaseExecuteSpy,
    } as any);

    jest.spyOn(SettingsDataSourceFactory, 'default').mockReturnValue({
      get: settingsGetSpy,
    } as any);

    jest.spyOn(settings, 'get').mockResolvedValue({ languages: [] } as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should throw when key query param is missing', async () => {
    settingsGetSpy.mockResolvedValue({ languages: [] });

    const { sut } = createSut({});

    await expect(sut.handleAsync()).rejects.toThrow();
  });

  it('should return 409 when language does not exist in settings', async () => {
    settingsGetSpy.mockResolvedValue({ languages: [{ key: 'en', label: 'English' }] });

    const { sut, response, emitToCurrentTenant } = createSut({ key: 'es' });

    await sut.handleAsync();

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith({
      error: 'Language is still being installed or does not exist',
    });
    expect(useCaseExecuteSpy).not.toHaveBeenCalled();
    expect(emitToCurrentTenant).not.toHaveBeenCalled();
  });

  it('should return 409 when language is still installing', async () => {
    settingsGetSpy.mockResolvedValue({
      languages: [{ key: 'es', label: 'Spanish', installing: true }],
    });

    const { sut, response, emitToCurrentTenant } = createSut({ key: 'es' });

    await sut.handleAsync();

    expect(response.status).toHaveBeenCalledWith(409);
    expect(useCaseExecuteSpy).not.toHaveBeenCalled();
    expect(emitToCurrentTenant).not.toHaveBeenCalled();
  });

  it('should call use case and respond 204 when language is installed', async () => {
    settingsGetSpy.mockResolvedValue({
      languages: [{ key: 'es', label: 'Spanish', installing: false }],
    });

    const { sut, response } = createSut({ key: 'es' });

    await sut.handleAsync();

    expect(useCaseExecuteSpy).toHaveBeenCalledWith({ key: 'es' });
    expect(response.sendStatus).toHaveBeenCalledWith(204);
  });

  it('should emit updateSettings and translationsDelete after successful deletion', async () => {
    const fakeSettings = { languages: [{ key: 'en', label: 'English' }] };
    settingsGetSpy.mockResolvedValue({
      languages: [{ key: 'es', label: 'Spanish', installing: false }],
    });
    jest.spyOn(settings, 'get').mockResolvedValue(fakeSettings as any);

    const { sut, emitToCurrentTenant } = createSut({ key: 'es' });

    await sut.handleAsync();

    expect(emitToCurrentTenant).toHaveBeenCalledWith('updateSettings', fakeSettings);
    expect(emitToCurrentTenant).toHaveBeenCalledWith('translationsDelete', 'es');
  });
});
