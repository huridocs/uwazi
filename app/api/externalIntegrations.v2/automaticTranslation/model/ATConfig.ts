/* eslint-disable max-classes-per-file */
import { Property } from 'api/core/domain/template/Property';
import { LanguageISO6391 } from 'shared/types/commonTypes';

class ATTemplateConfig {
  readonly template: string;

  readonly properties: Property[];

  constructor(template: string, properties: Property[]) {
    this.template = template;
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
    this.templates = templates.filter(t => t.properties.length);
  }

  propertiesByTemplate(templateId: string) {
    return this.templates.find(t => t.template === templateId)?.properties || [];
  }
}

export { ATConfig, ATTemplateConfig };
