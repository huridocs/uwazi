import { z } from 'zod';
import { AbstractUseCase } from '../libs/UseCase.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { Settings } from '#shared/types/settingsType.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { applySettingsDefaults } from './settings/settingsDefaults.js';
import { pickAdminFields } from './settings/publicSettings.js';

const InputSchema = z.object({
  key: z.string().min(1),
});

type Input = {
  key: LanguageISO6391 | string;
};

type Output = Partial<Settings>;

type Deps = {
  settingsDS: SettingsDataSource;
};

class SetDefaultLanguageUseCase extends AbstractUseCase<Input, Output, Deps> {
  static InputSchema = InputSchema;

  async execute(raw: Input): Promise<Output> {
    const { key } = SetDefaultLanguageUseCase.InputSchema.parse(raw);
    const current = await this.deps.settingsDS.get();
    const languages = (current.languages || []).map(language => ({
      ...language,
      default: language.key === key,
    }));

    const saved = await this.transactionManager.run(async () =>
      this.deps.settingsDS.patch({ languages })
    );

    return pickAdminFields(applySettingsDefaults(saved));
  }
}

export { SetDefaultLanguageUseCase };
export type { Input as SetDefaultLanguageInput };
