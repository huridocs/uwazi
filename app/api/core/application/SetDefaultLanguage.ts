import { z } from 'zod';
import { AbstractUseCase } from '../libs/UseCase.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { SettingsChangedEvent } from '#api/core/domain/settings/events/SettingsChangedEvent.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';

const InputSchema = z.object({
  key: z.string().min(1),
});

type Input = {
  key: LanguageISO6391 | string;
};

type Deps = {
  settingsDS: SettingsDataSource;
};

class SetDefaultLanguageUseCase extends AbstractUseCase<Input, void, Deps> {
  static InputSchema = InputSchema;

  async execute(raw: Input): Promise<void> {
    const { key } = SetDefaultLanguageUseCase.InputSchema.parse(raw);
    const settings = await this.deps.settingsDS.get();
    settings.setDefaultLanguage(key);

    await this.transactionManager.run(async () => {
      await this.deps.settingsDS.update(settings);
      await this.eventEmitter.emit(new SettingsChangedEvent({}));
    });
  }
}

export { SetDefaultLanguageUseCase };
export type { Input as SetDefaultLanguageInput };
