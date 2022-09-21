import { createDefaultValidator } from 'api/common.v2/validation/ajvInstances';
import { userDBOSchema, UserInputSchema } from './userSchemas';
import { UserDBOType, UserInputType } from './userTypes';

const validateUserDBO = createDefaultValidator<UserDBOType>(userDBOSchema);

const validateUserInputSchema = createDefaultValidator<UserInputType>(UserInputSchema);

export { validateUserDBO, validateUserInputSchema };
