import { ValidatorSchema, createValidator } from 'api/common.v2/validation/routesValidation';
import { RelationshipPropertyData } from 'shared/types/api.v2/templates.createTemplateRequest';

const createNewRelationshipPropertySchema: ValidatorSchema<
  RelationshipPropertyData,
  { query: RelationshipPropertyData['query'] }
> = {
  properties: {
    label: { type: 'string' },
    name: { type: 'string' },
    query: { ref: 'query' },
    type: { enum: ['newRelationship'] },
  },
  optionalProperties: {
    _id: { type: 'string' },
    denormalizedProperty: { type: 'string' },
    noLabel: { type: 'boolean' },
    required: { type: 'boolean' },
    showInCard: { type: 'boolean' },
    filter: { type: 'boolean' },
    defaultfilter: { type: 'boolean' },
  },
  definitions: {
    query: {
      elements: {
        properties: {
          direction: { enum: ['in', 'out'] },
          types: { elements: { type: 'string' } },
          match: {
            elements: {
              properties: {
                templates: { elements: { type: 'string' } },
              },
              optionalProperties: {
                traverse: { ref: 'query' },
              },
            },
          },
        },
      },
    },
  },
};

export const validateCreateNewRelationshipProperty = createValidator(
  createNewRelationshipPropertySchema
);
