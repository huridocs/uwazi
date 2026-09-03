import { z } from 'zod';
import { AbstractUseCase } from '../libs/UseCase.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { SaveSettingsUseCase } from './SaveSettings.js';
import { renameFilter } from './settings/libraryFilters.js';

const InputSchema = z.object({
  filterId: z.string(),
  name: z.string(),
});

type Input = {
  filterId: ObjectIdSchema;
  name: string;
};

type Output = boolean;

type Deps = {
  settingsDS: SettingsDataSource;
  saveSettings: SaveSettingsUseCase;
};

class UpdateFilterNameUseCase extends AbstractUseCase<Input, Output, Deps> {
  static InputSchema = InputSchema;

  async execute(raw: Input): Promise<Output> {
    const { filterId, name } = UpdateFilterNameUseCase.InputSchema.parse(raw);
    const current = await this.deps.settingsDS.get();
    const filters = renameFilter(current.filters || [], filterId, name);
    if (!filters) {
      return false;
    }
    await this.deps.saveSettings.execute({ filters });
    return true;
  }
}

export { UpdateFilterNameUseCase };
export type { Input as UpdateFilterNameInput };
