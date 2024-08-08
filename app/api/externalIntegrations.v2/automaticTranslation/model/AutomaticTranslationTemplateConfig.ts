class AutomatciTranslationTemplateConfig {
  readonly template: string;

  readonly commonProperties: string[];

  readonly properties: string[];

  constructor(template: string, commonProperties: string[], properties: string[]) {
    this.template = template;
    this.commonProperties = commonProperties;
    this.properties = properties;
  }
}

export { AutomatciTranslationTemplateConfig };
