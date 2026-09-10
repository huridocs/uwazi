import { TestUtils } from '#api/common.v2/utils/Test.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { EventEmitter } from '#api/core/libs/eventEmitter/EventEmitter.js';
import { SettingsChangedEvent } from '#api/core/domain/settings/events/SettingsChangedEvent.js';
import { Settings } from '#api/core/domain/settings/Settings.js';
import { SettingsService } from '../SettingsService.js';
import { SettingsTranslationService } from '../SettingsTranslationService.js';

const createSut = (isRunning = true) => {
  const stored = new Settings({
    filters: [{ id: '123', name: 'Batman' }],
    links: [{ id: 'menu1', title: 'Home', type: 'link', url: '/' }],
  });
  const settingsDS = TestUtils.mockClass<SettingsDataSource>({
    get: jest.fn().mockResolvedValue(stored),
    update: jest.fn().mockImplementation(async settings => settings),
  });
  const translations = TestUtils.mockClass<SettingsTranslationService>({
    reconcile: jest.fn().mockResolvedValue(undefined),
    reconcileFilters: jest.fn().mockResolvedValue(undefined),
    reconcileLinks: jest.fn().mockResolvedValue(undefined),
  });
  const transactionManager = TestUtils.mockClass<TransactionManager>({
    isRunning: jest.fn().mockReturnValue(isRunning),
  });
  const eventEmitter = TestUtils.mockClass<EventEmitter>({
    emit: jest.fn().mockResolvedValue(undefined),
  });

  return {
    settingsDS,
    translations,
    transactionManager,
    eventEmitter,
    service: new SettingsService({
      settingsDS,
      translations,
      transactionManager,
      eventEmitter,
      idGenerator: { generate: () => 'generated-id' },
    }),
  };
};

describe('SettingsService', () => {
  it('should persist filters and reconcile filter translations without going through SaveSettings', async () => {
    const { service, settingsDS, translations, eventEmitter } = createSut();
    const filters = [{ id: '123', name: 'The dark knight' }];

    await service.saveFilters(filters);

    expect(translations.reconcileFilters).toHaveBeenCalledWith(filters, [
      { id: '123', name: 'Batman' },
    ]);
    expect(translations.reconcileLinks).not.toHaveBeenCalled();
    expect(settingsDS.update).toHaveBeenCalledWith(expect.any(Settings));
    expect(eventEmitter.emit).toHaveBeenCalledWith(expect.any(SettingsChangedEvent));
  });

  it('should throw when called outside a transaction', async () => {
    const { service } = createSut(false);

    await expect(service.saveFilters([{ id: '123', name: 'X' }])).rejects.toThrow(
      'This operation must be called within a transaction'
    );
  });

  it('should rename a filter and skip the write when it is missing', async () => {
    const { service, settingsDS } = createSut();

    expect(await service.updateFilterName('123', 'The dark knight')).toBe(true);
    expect(settingsDS.update).toHaveBeenCalledWith(expect.any(Settings));

    expect(await service.updateFilterName('missing', 'Nope')).toBe(false);
  });

  it('should drop a template from filters and skip the write when there are none', async () => {
    const { service, settingsDS } = createSut();

    expect(await service.removeTemplateFromFilters('123')).toBe(true);
    expect(settingsDS.update).toHaveBeenCalled();

    settingsDS.get = jest.fn().mockResolvedValue(new Settings({}));
    expect(await service.removeTemplateFromFilters('123')).toBe(false);
    expect(settingsDS.update).toHaveBeenCalledTimes(1);
  });
});
