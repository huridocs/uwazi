import { AbstractUseCase } from '../libs/UseCase.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { Settings } from '#shared/types/settingsType.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { applySettingsDefaults, omitHiddenSettingsFields } from './settings/settingsDefaults.js';

type Input = {
  key: LanguageISO6391 | string;
};

type Output = Settings;

type Deps = {
  settingsDS: SettingsDataSource;
};

class SetDefaultLanguageUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ key }: Input): Promise<Output> {
    const current = await this.deps.settingsDS.get();
    const languages = (current.languages || []).map(language => ({
      ...language,
      default: language.key === key,
    }));

    const saved = await this.transactionManager.run(async () =>
      this.deps.settingsDS.patch({ languages })
    );

    return omitHiddenSettingsFields(applySettingsDefaults(saved));
  }
}

export { SetDefaultLanguageUseCase };
export type { Input as SetDefaultLanguageInput };
