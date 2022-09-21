import { objectIdSchema } from 'api/common.v2/database/schemas/commonSchemas';
import { userSchema as originalUserSchema } from 'shared/types/userSchema';

const emitSchemaTypes = true;

const userDBOSchema = {
  ...originalUserSchema,
  title: 'UserDBOType',
  definitions: { objectIdSchema },
  properties: {
    ...originalUserSchema.properties,
    _id: objectIdSchema,
    groups: {
      ...originalUserSchema.properties.groups,
      items: {
        ...originalUserSchema.properties.groups.items,
        properties: {
          ...originalUserSchema.properties.groups.items.properties,
          _id: objectIdSchema,
        },
      },
    },
  },
};

const UserInputSchema = {
  ...userDBOSchema,
  title: 'UserInputType',
  required: ['_id', 'role', 'groups'],
};

export { emitSchemaTypes, userDBOSchema, UserInputSchema };
