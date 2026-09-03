import { z } from 'zod';
import { AbstractUseCase } from '../libs/UseCase.js';
import { Settings } from '#shared/types/settingsType.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { TranslationsService } from './translation/TranslationsService.js';
import { persistMenuAndFilterTranslations } from './settings/menuAndFilterTranslations.js';
import { applySettingsDefaults } from './settings/settingsDefaults.js';
import { pickAdminFields } from './settings/publicSettings.js';
import { SaveSettingsInputSchema } from './settings/saveSettingsInput.js';
import { TemplateFacade } from '#api/core/infrastructure/facades/TemplateFacade.js';

type Input = z.infer<typeof SaveSettingsInputSchema>;

type Output = Partial<Settings>;

type Deps = {
  settingsDS: SettingsDataSource;
  translationsService: TranslationsService;
};

class SaveSettingsUseCase extends AbstractUseCase<Input, Output, Deps> {
  static InputSchema = SaveSettingsInputSchema;

  async execute(raw: Input): Promise<Output> {
    const incoming = SaveSettingsUseCase.InputSchema.parse(raw);
    const current = await this.deps.settingsDS.get();

    const saved = await this.transactionManager.run(async () => {
      await persistMenuAndFilterTranslations(this.deps.translationsService, incoming, current);
      return this.deps.settingsDS.patch(incoming);
    });

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
