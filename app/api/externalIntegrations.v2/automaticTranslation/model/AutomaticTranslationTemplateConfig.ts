class AutomaticTranslationTemplateConfig {
  readonly template: string;

  readonly commonProperties: string[];

  readonly properties: string[];

  constructor(properties: string[], template: string, commonProperties: string[] = []) {
    this.template = template;
    this.commonProperties = commonProperties;
    this.properties = properties;
  }
}

export { AutomaticTranslationTemplateConfig };
