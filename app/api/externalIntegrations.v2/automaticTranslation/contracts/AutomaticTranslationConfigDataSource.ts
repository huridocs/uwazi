import { RawAutomaticTranslationConfig } from '../model/RawAutomaticTranslationConfig';

export interface AutomaticTranslationConfigDataSource {
  get(): Promise<RawAutomaticTranslationConfig>;
  update(config: RawAutomaticTranslationConfig): Promise<RawAutomaticTranslationConfig>;
}
