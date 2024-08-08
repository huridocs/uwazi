import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { AutomaticTranslationConfigDataSource } from './contracts/AutomaticTranslationConfigDataSource';
import { AutomaticTranslationConfig } from './model/AutomaticTranslationConfig';

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
      return {
        template: templateData?.id ?? '',
        properties: (configData.properties || []).map(
          label => templateData?.properties.find(p => p.label === label)?.id ?? ''
        ),
        commonProperties: (configData.commonProperties || []).map(
          label => label //templateData?.commonProperties.find(p => p.label === label)?.id <-- the DataSource is not returning the common properties
        ),
      };
    });

    const config: AutomaticTranslationConfig = {
      active: semanticConfig.active,
      templates,
      languages: [],
    };

    return this.atuomaticTranslationConfigDS.update(config);
  }
}

export type { SemanticConfig };
