import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { AutomaticTranslationConfigDataSource } from './contracts/AutomaticTranslationConfigDataSource';
import { AutomaticTranslationConfig } from './model/AutomaticTranslationConfig';
import { AutomaticTranslationTemplateConfig } from './model/AutomaticTranslationTemplateConfig';

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
      return new AutomaticTranslationTemplateConfig(
        (configData.properties || []).map(
          label => templateData?.properties.find(p => p.label === label)?.id ?? ''
        ),
        templateData?.id ?? '',
        (configData.commonProperties || []).map(
          label => templateData?.commonProperties.find(p => p.label === label)?.id ?? ''
        )
      );
    });

    const config = new AutomaticTranslationConfig(semanticConfig.active, [], templates);

    return this.atuomaticTranslationConfigDS.update(config);
  }
}

export type { SemanticConfig };
