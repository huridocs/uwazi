import { ValidatorSchema, createValidator } from 'api/common.v2/validation/routesValidation';
import {
  Filter,
  RelationshipPropertyData,
} from 'shared/types/api.v2/templates.createTemplateRequest';

const createNewRelationshipPropertySchema: ValidatorSchema<
  RelationshipPropertyData,
  { query: RelationshipPropertyData['query']; filter: Filter }
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
                filter: { ref: 'filter' },
              },
              optionalProperties: {
                traverse: { ref: 'query' },
              },
            },
          },
        },
      },
    },
    filter: {
      discriminator: 'type',
      mapping: {
        and: {
          properties: {
            value: { elements: { ref: 'filter' } },
          },
        },
        template: {
          properties: {
            value: { elements: { type: 'string' } },
          },
        },
        void: {
          properties: {},
        },
      },
    },
  },
};

export const validateCreateNewRelationshipProperty = createValidator(
  createNewRelationshipPropertySchema
);
