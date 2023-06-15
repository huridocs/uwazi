import { objectIdSchema } from 'shared/types/commonSchemas';

export const emitSchemaTypes = true;

export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  COLLABORATOR = 'collaborator',
}

export const userSchema = {
  type: 'object',
  additionalProperties: false,
  definitions: { objectIdSchema },
  properties: {
    _id: objectIdSchema,
    __v: { type: 'number' },
    username: { type: 'string', minLength: 1 },
    role: { type: 'string', enum: Object.values(UserRole) },
    email: { type: 'string', minLength: 1 },
    password: { type: 'string', minLength: 1 },
    using2fa: { type: 'boolean' },
    accountLocked: { type: 'boolean' },
    failedLogins: { type: 'number' },
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
  required: ['username', 'role', 'email'],
};
