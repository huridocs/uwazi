import { objectIdSchema } from 'shared/types/commonSchemas';

export const emitSchemaTypes = true;

export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  COLLABORATOR = 'collaborator',
}

export const UserSchema = {
  type: 'object',
  additionalProperties: false,
  definitions: { objectIdSchema },
  properties: {
    _id: objectIdSchema,
    __v: { type: 'number' },
    username: { type: 'string' },
    role: { type: 'string', enum: Object.values(UserRole) },
    email: { type: 'string' },
    using2fa: { type: 'boolean' },
    groups: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          _id: objectIdSchema,
          name: { type: 'string' },
        },
        required: ['_id', 'name'],
      },
    },
  },
};
