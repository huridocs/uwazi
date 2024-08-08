import { LanguageISO6391 } from 'shared/types/commonTypes';
import { AutomatciTranslationTemplateConfig } from './AutomaticTranslationTemplateConfig';

class AutomaticTranslationConfig {
  readonly active: boolean;

  readonly languages: LanguageISO6391[];

  readonly templates: AutomatciTranslationTemplateConfig[];

  constructor(
    active: boolean,
    languages: LanguageISO6391[],
    templates: AutomatciTranslationTemplateConfig[]
  ) {
    this.active = active;
    this.languages = languages;
    this.templates = templates;
  }
}

export { AutomaticTranslationConfig };
