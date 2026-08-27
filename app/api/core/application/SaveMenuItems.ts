import { AbstractUseCase } from '../libs/UseCase.js';
import { Settings } from '#shared/types/settingsType.js';
import { SaveSettingsUseCase } from './SaveSettings.js';
import { SaveMenuItemsInputSchema } from './settings/saveSettingsInput.js';

type Input = {
  links: NonNullable<Settings['links']>;
};

type Output = Partial<Settings>;

type Deps = {
  saveSettings: SaveSettingsUseCase;
};

class SaveMenuItemsUseCase extends AbstractUseCase<Input, Output, Deps> {
  static InputSchema = SaveMenuItemsInputSchema;

  async execute(raw: Input): Promise<Output> {
    const { links } = SaveMenuItemsUseCase.InputSchema.parse(raw);
    return this.deps.saveSettings.execute({ links });
  }
}

export { SaveMenuItemsUseCase };
export type { Input as SaveMenuItemsInput };
