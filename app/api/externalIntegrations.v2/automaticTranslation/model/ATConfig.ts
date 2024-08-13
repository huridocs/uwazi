/* eslint-disable max-classes-per-file */
import { LanguageISO6391 } from 'shared/types/commonTypes';

class ATTemplateConfig {
  readonly template: string;

  readonly commonProperties: string[];

  readonly properties: string[];

  constructor(template: string, properties: string[], commonProperties: string[] = []) {
    this.template = template;
    this.commonProperties = commonProperties;
    this.properties = properties;
  }
}

class ATConfig {
  readonly active: boolean;

  readonly languages: LanguageISO6391[];

  readonly templates: ATTemplateConfig[];

  constructor(active: boolean, languages: LanguageISO6391[], templates: ATTemplateConfig[]) {
    this.active = active;
    this.languages = languages;
    this.templates = templates.filter(t => t.commonProperties.length || t.properties.length);
  }
}

export { ATConfig, ATTemplateConfig };
