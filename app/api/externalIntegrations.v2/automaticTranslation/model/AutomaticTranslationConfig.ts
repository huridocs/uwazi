import { LanguageISO6391 } from 'shared/types/commonTypes';
import { AutomaticTranslationTemplateConfig } from './AutomaticTranslationTemplateConfig';

class AutomaticTranslationConfig {
  readonly active: boolean;

  readonly languages: LanguageISO6391[];

  readonly templates: AutomaticTranslationTemplateConfig[];

  constructor(
    active: boolean,
    languages: LanguageISO6391[],
    templates: AutomaticTranslationTemplateConfig[]
  ) {
    this.active = active;
    this.languages = languages;
    this.templates = templates.filter(t => t.commonProperties.length || t.properties.length);
  }
}

export { AutomaticTranslationConfig };
