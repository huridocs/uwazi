import { AbstractUseCase } from '../libs/UseCase.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { Settings } from '#shared/types/settingsType.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { SaveSettingsUseCase } from './SaveSettings.js';
import { renameFilter } from './settings/filterTree.js';

type Input = {
  filterId: ObjectIdSchema;
  name: string;
};

type Output = Settings | undefined;

type Deps = {
  settingsDS: SettingsDataSource;
  saveSettings: SaveSettingsUseCase;
};

class UpdateFilterNameUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ filterId, name }: Input): Promise<Output> {
    const current = (await this.deps.settingsDS.find()) ?? {};
    const filters = renameFilter(current.filters || [], filterId, name);
    if (!filters) {
      return undefined;
    }
    return this.deps.saveSettings.execute({ filters });
  }
}

export { UpdateFilterNameUseCase };
export type { Input as UpdateFilterNameInput };
