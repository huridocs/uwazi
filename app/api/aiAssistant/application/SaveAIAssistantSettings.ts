import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { Settings } from '#api/core/domain/settings/Settings.js';
import type { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import type { AIAssistantSettings } from '#shared/types/settingsType.js';
import {
  AIAssistantSettingsInputSchema,
  toSettingsView,
  type AIAssistantSettingsView,
} from './AIAssistantSettings.js';

type Input = AIAssistantSettings;

type Output = AIAssistantSettingsView;

type Dependencies = {
  settingsDataSource: SettingsDataSource;
};

class SaveAIAssistantSettings extends AbstractUseCase<Input, Output, Dependencies> {
  async execute(input: Input): Promise<Output> {
    const parsed = AIAssistantSettingsInputSchema.parse(input);
    const current = await this.deps.settingsDataSource.get();
    const next = new Settings({
      ...current.toState(),
      aiAssistant: parsed,
    });
    await this.deps.settingsDataSource.update(next);
    return toSettingsView(parsed, true);
  }
}

export { SaveAIAssistantSettings };
export type { Input as SaveAIAssistantSettingsInput, Output as SaveAIAssistantSettingsOutput };
