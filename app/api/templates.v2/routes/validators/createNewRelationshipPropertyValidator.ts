import { ValidatorSchema, createValidator } from 'api/common.v2/validation/ajvInstances';

interface MatchQueryInputType {
  templates: string[];
  traverse?: TraverseQueryInputType[];
}

interface TraverseQueryInputType {
  direction: 'in' | 'out';
  types: string[];
  match: MatchQueryInputType[];
}

interface RelationshipProperty {
  label: string;
  name: string;
  query: TraverseQueryInputType[];
  denormalizedProperty?: string;
}

const createNewRelationshipPropertySchema: ValidatorSchema<
  RelationshipProperty,
  { query: RelationshipProperty['query'] }
> = {
  properties: {
    label: { type: 'string' },
    name: { type: 'string' },
    query: { ref: 'query' },
  },
  optionalProperties: {
    denormalizedProperty: { type: 'string' },
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
