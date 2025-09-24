// @ts-expect-error TS(2307): Cannot find module '../common.v2/validation/routes... Remove this comment to see the full error message
import { createValidator, ValidatorSchema } from '../common.v2/validation/routesValidation.js';
import {
  CreateRelationshipData,
  EntityReference,
  TextReference,
  // @ts-expect-error TS(2307): Cannot find module '../../shared/types/api.v2/rela... Remove this comment to see the full error message
} from 'shared/types/api.v2/relationships.createRelationshipsRequest.js';

const schema: ValidatorSchema<
  CreateRelationshipData,
  { reference: EntityReference | TextReference }
> = {
  elements: {
    properties: {
      type: { type: 'string' },
      from: { ref: 'reference' },
      to: { ref: 'reference' },
    },
  },
  definitions: {
    reference: {
      discriminator: 'type',
      mapping: {
        entity: {
          properties: { entity: { type: 'string' } },
        },
        text: {
          properties: {
            text: { type: 'string' },
            selections: {
              elements: {
                properties: {
                  page: { type: 'uint32' },
                  top: { type: 'float64' },
                  left: { type: 'float64' },
                  width: { type: 'float64' },
                  height: { type: 'float64' },
                },
              },
            },
            file: { type: 'string' },
            entity: { type: 'string' },
          },
        },
      },
    },
  },
};

export const validateCreateRelationship = createValidator(schema);
