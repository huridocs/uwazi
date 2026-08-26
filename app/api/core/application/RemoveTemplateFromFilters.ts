import { AbstractUseCase } from '../libs/UseCase.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { Settings } from '#shared/types/settingsType.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { SaveSettingsUseCase } from './SaveSettings.js';
import { removeTemplateFromFilters } from './settings/filterTree.js';

type Input = {
  templateId: ObjectIdSchema;
};

type Output = Settings | undefined;

type Deps = {
  settingsDS: SettingsDataSource;
  saveSettings: SaveSettingsUseCase;
};

class RemoveTemplateFromFiltersUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute({ templateId }: Input): Promise<Output> {
    const current = (await this.deps.settingsDS.find()) ?? {};
    if (!current.filters) {
      return undefined;
    }
    return this.deps.saveSettings.execute({
      filters: removeTemplateFromFilters(current.filters, templateId),
    });
  }
}

export { RemoveTemplateFromFiltersUseCase };
export type { Input as RemoveTemplateFromFiltersInput };
