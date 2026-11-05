import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import type { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { toSettingsView, type AIAssistantSettingsView } from './AIAssistantSettings.js';

type Input = {
  includeSecrets: boolean;
};

type Output = AIAssistantSettingsView;

type Dependencies = {
  settingsDataSource: SettingsDataSource;
};

class GetAIAssistantSettings extends AbstractUseCase<Input, Output, Dependencies> {
  async execute(input: Input): Promise<Output> {
    const settings = await this.deps.settingsDataSource.get();
    return toSettingsView(settings.toState().aiAssistant, input.includeSecrets);
  }
}

export { GetAIAssistantSettings };
export type { Input as GetAIAssistantSettingsInput, Output as GetAIAssistantSettingsOutput };
