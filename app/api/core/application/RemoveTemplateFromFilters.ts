import { z } from 'zod';
import { AbstractUseCase } from '../libs/UseCase.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { SaveSettingsUseCase } from './SaveSettings.js';
import { removeTemplateFromFilters } from './settings/libraryFilters.js';
import { objectIdValue } from './settings/menuItems.js';

const InputSchema = z.object({
  templateId: objectIdValue,
});

type Input = {
  templateId: ObjectIdSchema;
};

type Output = boolean;

type Deps = {
  settingsDS: SettingsDataSource;
  saveSettings: SaveSettingsUseCase;
};

class RemoveTemplateFromFiltersUseCase extends AbstractUseCase<Input, Output, Deps> {
  static InputSchema = InputSchema;

  async execute(raw: Input): Promise<Output> {
    const { templateId } = RemoveTemplateFromFiltersUseCase.InputSchema.parse(raw);
    const current = (await this.deps.settingsDS.find()) ?? {};
    if (!current.filters) {
      return false;
    }
    await this.deps.saveSettings.execute({
      filters: removeTemplateFromFilters(current.filters, templateId),
    });
    return true;
  }
}

export { RemoveTemplateFromFiltersUseCase };
export type { Input as RemoveTemplateFromFiltersInput };
