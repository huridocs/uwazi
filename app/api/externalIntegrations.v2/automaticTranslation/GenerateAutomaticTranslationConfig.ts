import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { JTDSchemaType } from 'ajv/dist/core';
import { Ajv } from 'ajv';
import { ATConfigDataSource } from './contracts/ATConfigDataSource';
import { ATTemplateConfig } from './model/ATConfig';
import { RawATConfig } from './model/RawATConfig';
import { GenerateATConfigError, InvalidInputDataFormat } from './errors/generateATErrors';
import { ATConfigValidator } from './contracts/ATConfigValidator';

interface SemanticConfig {
  active: boolean;
  templates: {
    template: string;
    commonProperties?: string[];
    properties?: string[];
  }[];
}

const schema: JTDSchemaType<SemanticConfig> = {
  additionalProperties: false,
  properties: {
    active: { type: 'boolean' },
    templates: {
      elements: {
        properties: {
          template: { type: 'string' },
        },
        optionalProperties: {
          properties: { elements: { type: 'string' } },
          commonProperties: { elements: { type: 'string' } },
        },
      },
    },
  },
};

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
    // const ajv = new Ajv({ strict: false });
    // const validate = ajv.compile<SemanticConfig>(schema);
    if (!this.validator.validate(semanticConfig)) {
      throw new InvalidInputDataFormat();
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

export type { SemanticConfig };
