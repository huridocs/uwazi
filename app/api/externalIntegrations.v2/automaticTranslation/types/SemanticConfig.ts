import { JTDSchemaType } from 'ajv/dist/core';

interface SemanticConfig {
  active: boolean;
  templates: {
    template: string;
    commonProperties?: string[];
    properties?: string[];
  }[];
}

const semanticConfigSchema: JTDSchemaType<SemanticConfig> = {
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

export type { SemanticConfig };
export { semanticConfigSchema };
