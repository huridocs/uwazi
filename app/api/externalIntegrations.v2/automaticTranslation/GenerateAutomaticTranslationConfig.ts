import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { ATConfigDataSource } from './contracts/ATConfigDataSource';
import { ATTemplateConfig } from './model/ATConfig';
import { RawATConfig } from './model/RawATConfig';
import { GenerateATConfigError, InvalidInputDataFormat } from './errors/generateATErrors';
import { ATConfigValidator } from './contracts/ATConfigValidator';
import { SemanticConfig } from './types/SemanticConfig';

export class GenerateAutomaticTranslationsCofig {
  private atuomaticTranslationConfigDS: ATConfigDataSource;

  private templatsDS: TemplatesDataSource;

  private validator: ATConfigValidator;

  constructor(
    atuomaticTranslationConfigDS: ATConfigDataSource,
    templatesDS: TemplatesDataSource,
    validator: ATConfigValidator
  ) {
    this.atuomaticTranslationConfigDS = atuomaticTranslationConfigDS;
    this.templatsDS = templatesDS;
    this.validator = validator;
  }

  async execute(semanticConfig: SemanticConfig) {
    const validate = this.validator.validate(semanticConfig);
    if (!validate.isValid) {
      throw new InvalidInputDataFormat(validate.errors?.[0]);
    }

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
        (configData.properties || []).map(label => {
          const foundProperty = templateData.properties.find(p => p.label === label);
          if (!foundProperty) {
            throw new GenerateATConfigError(`Property not found: ${label}`);
          }
          return foundProperty.id;
        }),
        (configData.commonProperties || []).map(label => {
          const foundProperty = templateData?.commonProperties.find(p => p.label === label);
          if (!foundProperty) {
            throw new GenerateATConfigError(`Common property not found: ${label}`);
          }
          return foundProperty.id;
        })
      );
    });

    return this.atuomaticTranslationConfigDS.update(
      new RawATConfig(semanticConfig.active, templates)
    );
  }
}
