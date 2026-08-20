import { objectIdSchema } from '#shared/types/commonSchemas.js';

export const emitSchemaTypes = true;

export const groupMemberSchema = {
  type: 'object',
  additionalProperties: false,
  definitions: { objectIdSchema },
  properties: {
    refId: objectIdSchema,
  },
  required: ['refId'],
};
/**
 * Kept as the source `yarn emit-types` generates userGroupType.d.ts from — `UserGroupSchema`
 * is still the type for userGroupsModel.ts, testing_db.ts and, via apiResponseTypes.d.ts,
 * the frontend's ClientUserGroupSchema. It is no longer compiled by AJV: request validation
 * lives in the zod schemas of the userGroups controllers, and the `uniqueName` keyword it
 * used to carry is now MongoUserGroupsDataSource.checkUniqueName.
 */
export const userGroupSchema = {
  $schema: 'http://json-schema.org/schema#',
  type: 'object',
  additionalProperties: false,
  definitions: { objectIdSchema, groupMemberSchema },
  properties: {
    _id: objectIdSchema,
    name: { type: 'string' },
    members: {
      type: 'array',
      items: groupMemberSchema,
    },
    __v: { type: 'number' },
  },
  required: ['name', 'members'],
};
