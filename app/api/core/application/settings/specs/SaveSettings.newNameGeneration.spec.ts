import { TestUtils } from '#api/common.v2/utils/Test.js';
import { TranslationsService } from '#api/core/application/translation/TranslationsService.js';
import { TranslationsServiceFactory } from '#api/core/infrastructure/factories/TranslationsServiceFactory.js';
import { SaveSettingsUseCaseFactory } from '#api/core/infrastructure/factories/SaveSettingsUseCaseFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TemplateFacade } from '#api/core/infrastructure/facades/TemplateFacade.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { SaveSettingsInput } from '../../SaveSettings.js';
import fixtures from './fixtures.js';

const saveSettings = async (input: SaveSettingsInput) =>
  testingEnvironment.runWithContext(async () =>
    SaveSettingsUseCaseFactory.default().execute(input)
  );

describe('SaveSettings newNameGeneration', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    jest.spyOn(TranslationsServiceFactory, 'default').mockReturnValue(
      TestUtils.mockClass<TranslationsService>({
        updateContext: jest.fn().mockResolvedValue(undefined),
      })
    );
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should apply new name generation when enabling the flag', async () => {
    const apply = jest.spyOn(TemplateFacade, 'applyNewNameGeneration').mockResolvedValue(undefined);

    await saveSettings({ newNameGeneration: true });

    expect(apply).toHaveBeenCalledWith('es');
  });

  it('should not apply when the flag is already enabled', async () => {
    await testingEnvironment.runWithContext(async () =>
      SettingsDataSourceFactory.default().patch({ newNameGeneration: true })
    );
    const apply = jest.spyOn(TemplateFacade, 'applyNewNameGeneration').mockResolvedValue(undefined);

    await saveSettings({ newNameGeneration: true });

    expect(apply).not.toHaveBeenCalled();
  });

  it('should not apply when the flag is not in the payload', async () => {
    const apply = jest.spyOn(TemplateFacade, 'applyNewNameGeneration').mockResolvedValue(undefined);

    await saveSettings({ site_name: 'Unrelated change' });

    expect(apply).not.toHaveBeenCalled();
  });
});
