import { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { ATConfigDataSource } from '#api/externalIntegrations.v2/automaticTranslation/contracts/ATConfigDataSource.js';
import { GenerateATConfigError } from '#api/externalIntegrations.v2/automaticTranslation/errors/generateATErrors.js';
import { Validator } from '#api/externalIntegrations.v2/automaticTranslation/infrastructure/Validator.js';
import { ATTemplateConfig } from '#api/externalIntegrations.v2/automaticTranslation/model/ATConfig.js';
import { SemanticConfig } from '#api/externalIntegrations.v2/automaticTranslation/types/SemanticConfig.js';

export class GenerateAutomaticTranslationsCofig {
  private atuomaticTranslationConfigDS: ATConfigDataSource;

  private templatsDS: TemplatesDataSource;

  private validator: Validator<SemanticConfig>;

  constructor(
    atuomaticTranslationConfigDS: ATConfigDataSource,
    templatesDS: TemplatesDataSource,
    validator: Validator<SemanticConfig>
  ) {
    this.atuomaticTranslationConfigDS = atuomaticTranslationConfigDS;
    this.templatsDS = templatesDS;
    this.validator = validator;
  }

  async execute(semanticConfig: SemanticConfig | unknown) {
    this.validator.ensure(semanticConfig);

    const templatesData = await this.templatsDS
      .getByNames(semanticConfig.templates.map(t => t.template))
      .all();

    const templates = semanticConfig.templates.map(configData => {
      const templateData = templatesData.find(t => t.name === configData.template);
      if (!templateData) {
        throw new GenerateATConfigError(`Template not found: ${configData.template}`);
      }
      return new ATTemplateConfig(
        templateData?.id,
        (configData.properties || [])
          .map(label => {
            const foundProperty = templateData.properties.find(p => p.label === label);
            if (!foundProperty) {
              throw new GenerateATConfigError(`Property not found: ${label}`);
            }
            return foundProperty;
          })
          .concat(
            (configData.commonProperties || []).map(label => {
              const foundProperty = templateData?.commonProperties.find(p => p.label === label);
              if (!foundProperty) {
                throw new GenerateATConfigError(`Common property not found: ${label}`);
              }
              return foundProperty;
            })
          )
      );
    });

    return this.atuomaticTranslationConfigDS.update(semanticConfig.active, templates);
  }
}
