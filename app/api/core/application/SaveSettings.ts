import { z } from 'zod';
import { AbstractUseCase } from '../libs/UseCase.js';
import { Settings } from '#api/core/domain/settings/Settings.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { SaveSettingsInputSchema } from './settings/saveSettingsInput.js';
import { SettingsService } from './settings/SettingsService.js';
import { TemplateFacade } from '#api/core/infrastructure/facades/TemplateFacade.js';

type Input = z.infer<typeof SaveSettingsInputSchema>;

type Deps = {
  settingsDS: SettingsDataSource;
  settingsService: SettingsService;
};

class SaveSettingsUseCase extends AbstractUseCase<Input, void, Deps> {
  static InputSchema = SaveSettingsInputSchema;

  async execute(raw: Input): Promise<void> {
    const incoming = SaveSettingsUseCase.InputSchema.parse(raw);
    const current = await this.deps.settingsDS.get();
    const previous = new Settings(current.toState());

    await this.transactionManager.run(async () =>
      this.deps.settingsService.save(incoming, current)
    );

    if (current.didEnableNewNameGeneration(previous)) {
      const defaultLanguage = current.languages?.find(language => language.default)?.key;
      if (defaultLanguage) {
        await TemplateFacade.applyNewNameGeneration(defaultLanguage);
      }
    }
  }
}

export { SaveSettingsUseCase };
export type { Input as SaveSettingsInput };
