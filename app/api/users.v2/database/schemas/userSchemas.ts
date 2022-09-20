import { objectIdSchema } from 'api/common.v2/database/schemas/commonSchemas';
import { createDefaultValidator } from 'api/common.v2/validation/ajvInstances';
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
const validateUserDBO = createDefaultValidator(userDBOSchema);

export { emitSchemaTypes, userDBOSchema, validateUserDBO };
