import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { AutomaticTranslationConfigDataSource } from './contracts/AutomaticTranslationConfigDataSource';
import { AutomaticTranslationTemplateConfig } from './model/AutomaticTranslationTemplateConfig';
import { RawAutomaticTranslationConfig } from './model/RawAutomaticTranslationConfig';

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
        templateData?.id ?? '',
        (configData.properties || []).map(
          label => templateData?.properties.find(p => p.label === label)?.id ?? ''
        ),
        (configData.commonProperties || []).map(
          label => templateData?.commonProperties.find(p => p.label === label)?.id ?? ''
        )
      );
    });

    return this.atuomaticTranslationConfigDS.update(
      new RawAutomaticTranslationConfig(semanticConfig.active, templates)
    );
  }
}

export type { SemanticConfig };
