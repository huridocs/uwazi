import { TestUtils } from '#api/common.v2/utils/Test.js';
import { TranslationsService } from '#api/core/application/translation/TranslationsService.js';
import { SettingsTranslationService } from '../SettingsTranslationService.js';

describe('SettingsTranslationService', () => {
  it('should reconcile filter group translations when names change', async () => {
    const translationsService = TestUtils.mockClass<TranslationsService>({
      updateContext: jest.fn().mockResolvedValue(undefined),
    });
    const service = new SettingsTranslationService(translationsService);

    await service.reconcileFilters(
      [
        { id: '1', name: 'Judge' },
        { id: '2', name: 'Important Documents', items: [] },
      ],
      [
        { id: '1', name: 'Judge' },
        { id: '2', name: 'Documents', items: [] },
        { id: '3', name: 'Files', items: [] },
      ]
    );

    expect(translationsService.updateContext).toHaveBeenCalledWith({
      context: { id: 'Filters', label: 'Filters', type: 'Uwazi UI' },
      keyChanges: { Documents: 'Important Documents' },
      keysToDelete: ['Files'],
      valueChanges: { 'Important Documents': 'Important Documents' },
    });
  });

  it('should reconcile menu translations by id after lifting leftover _id', async () => {
    const translationsService = TestUtils.mockClass<TranslationsService>({
      updateContext: jest.fn().mockResolvedValue(undefined),
    });
    const service = new SettingsTranslationService(translationsService);

    await service.reconcileLinks(
      [{ id: 'menu1', title: 'Home', type: 'link', url: '/' }],
      [{ _id: 'menu1', title: 'Page one', type: 'link', url: '/' }]
    );

    expect(translationsService.updateContext).toHaveBeenCalledWith({
      context: { id: 'Menu', label: 'Menu', type: 'Uwazi UI' },
      keyChanges: { 'Page one': 'Home' },
      keysToDelete: [],
      valueChanges: { Home: 'Home' },
    });
  });
});
