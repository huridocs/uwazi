import { AbstractUseCase } from '../libs/UseCase.js';
import { Settings } from '#shared/types/settingsType.js';
import { SaveSettingsUseCase } from './SaveSettings.js';

type Input = {
  links: NonNullable<Settings['links']>;
};

type Output = Settings;

type Deps = {
  saveSettings: SaveSettingsUseCase;
};

class SaveSettingsLinksUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ links }: Input): Promise<Output> {
    return this.deps.saveSettings.execute({ links });
  }
}

export { SaveSettingsLinksUseCase };
export type { Input as SaveSettingsLinksInput };
