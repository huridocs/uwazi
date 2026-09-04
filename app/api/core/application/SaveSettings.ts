import { z } from 'zod';
import { AbstractUseCase } from '../libs/UseCase.js';
import { Settings } from '#shared/types/settingsType.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { applySettingsDefaults } from './settings/settingsDefaults.js';
import { pickAdminFields } from './settings/publicSettings.js';
import { SaveSettingsInputSchema } from './settings/saveSettingsInput.js';
import { SettingsService } from './settings/SettingsService.js';
import { TemplateFacade } from '#api/core/infrastructure/facades/TemplateFacade.js';

type Input = z.infer<typeof SaveSettingsInputSchema>;

type Output = Partial<Settings>;

type Deps = {
  settingsDS: SettingsDataSource;
  settingsService: SettingsService;
};

class SaveSettingsUseCase extends AbstractUseCase<Input, Output, Deps> {
  static InputSchema = SaveSettingsInputSchema;

  async execute(raw: Input): Promise<Output> {
    const incoming = SaveSettingsUseCase.InputSchema.parse(raw);
    const current = await this.deps.settingsDS.get();

    const saved = await this.transactionManager.run(async () =>
      this.deps.settingsService.save(incoming, current)
    );

    if (!current.newNameGeneration && incoming.newNameGeneration) {
      const defaultLanguage = current.languages?.find(language => language.default)?.key;
      if (defaultLanguage) {
        await TemplateFacade.applyNewNameGeneration(defaultLanguage);
      }
    }

    return pickAdminFields(applySettingsDefaults(saved));
  }
}

export { SaveSettingsUseCase };
export type { Input as SaveSettingsInput };
