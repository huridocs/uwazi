import { AutomaticTranslationConfig } from 'shared/types/settingsType';

export interface AutomaticTranslationConfigDataSource {
  get(): Promise<AutomaticTranslationConfig>;
  update(config: AutomaticTranslationConfig): Promise<AutomaticTranslationConfig>;
}
