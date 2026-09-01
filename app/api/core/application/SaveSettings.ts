import { z } from 'zod';
import { AbstractUseCase } from '../libs/UseCase.js';
import { Settings } from '#shared/types/settingsType.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { TranslationsService } from './translation/TranslationsService.js';
import { persistMenuAndFilterTranslations } from './settings/menuAndFilterTranslations.js';
import { applySettingsDefaults } from './settings/settingsDefaults.js';
import { pickAdminFields } from './settings/publicSettings.js';
import { toPersistableFilters } from './settings/libraryFilters.js';
import { toPersistableMenuItems } from './settings/menuItems.js';
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
    const current = (await this.deps.settingsDS.find()) ?? {};
    const id = current._id ?? this.idGenerator.generate();
    const toPersist = {
      ...incoming,
      ...(incoming.links
        ? { links: toPersistableMenuItems(incoming.links, () => this.idGenerator.generate()) }
        : {}),
      ...(incoming.filters ? { filters: toPersistableFilters(incoming.filters) } : {}),
    };

    const saved = await this.transactionManager.run(async () => {
      await persistMenuAndFilterTranslations(this.deps.translationsService, toPersist, current);
      return this.deps.settingsDS.patch({ ...toPersist, _id: id });
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
