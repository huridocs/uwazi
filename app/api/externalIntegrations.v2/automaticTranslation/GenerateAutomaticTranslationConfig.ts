import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { AutomaticTranslationConfigDataSource } from './contracts/AutomaticTranslationConfigDataSource';
import { AutomaticTranslationTemplateConfig } from './model/AutomaticTranslationTemplateConfig';
import { RawAutomaticTranslationConfig } from './model/RawAutomaticTranslationConfig';
import { GenerateAutomaticTranslationConfigError } from './errors/generateAutomaticTranslationErrors';

interface SemanticConfig {
  active: boolean;
  templates: {
    template: string;
    commonProperties?: string[];
    properties?: string[];
  }[];
}

export class GenerateAutomaticTranslationsCofig {
  private atuomaticTranslationConfigDS: AutomaticTranslationConfigDataSource;

  private templatsDS: TemplatesDataSource;

  constructor(
    atuomaticTranslationConfigDS: AutomaticTranslationConfigDataSource,
    templatesDS: TemplatesDataSource
  ) {
    this.atuomaticTranslationConfigDS = atuomaticTranslationConfigDS;
    this.templatsDS = templatesDS;
  }

  async execute(semanticConfig: SemanticConfig) {
    const templatesData = await this.templatsDS
      .getByNames(semanticConfig.templates.map(t => t.template))
      .all();

    const templates = semanticConfig.templates.map(configData => {
      const templateData = templatesData.find(t => t.name === configData.template);
      if (!templateData) {
        throw new GenerateAutomaticTranslationConfigError(
          `Template not found: ${configData.template}`
        );
      }
      return new AutomaticTranslationTemplateConfig(
        templateData?.id,
        (configData.properties || []).map(label => {
          const foundProperty = templateData.properties.find(p => p.label === label);
          if (!foundProperty) {
            throw new GenerateAutomaticTranslationConfigError(`Property not found: ${label}`);
          }
          return foundProperty.id;
        }),
        (configData.commonProperties || []).map(label => {
          const foundProperty = templateData?.commonProperties.find(p => p.label === label);
          if (!foundProperty) {
            throw new GenerateAutomaticTranslationConfigError(
              `Common property not found: ${label}`
            );
          }
          return foundProperty.id;
        })
      );
    });

    return this.atuomaticTranslationConfigDS.update(
      new RawAutomaticTranslationConfig(semanticConfig.active, templates)
    );
  }
}

export type { SemanticConfig };
