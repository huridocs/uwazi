import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { AutomaticTranslationConfigDataSource } from './contracts/AutomaticTranslationConfigDataSource';
import { AutomaticTranslationTemplateConfig } from './model/AutomaticTranslationTemplateConfig';
import { RawAutomaticTranslationConfig } from './model/RawAutomaticTranslationConfig';
import {
  GenerateAutomaticTranslationConfigError,
  InvalidInputDataFormat,
} from './errors/generateAutomaticTranslationErrors';
import { JTDSchemaType } from 'ajv/dist/core';
import { Ajv } from 'ajv';
import { AutomaticTranslationConfigValidator } from './contracts/AutomaticTranslationConfigValidator';

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
  private atuomaticTranslationConfigDS: AutomaticTranslationConfigDataSource;

  private templatsDS: TemplatesDataSource;

  private validator: AutomaticTranslationConfigValidator;

  constructor(
    atuomaticTranslationConfigDS: AutomaticTranslationConfigDataSource,
    templatesDS: TemplatesDataSource,
    validator: AutomaticTranslationConfigValidator
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
