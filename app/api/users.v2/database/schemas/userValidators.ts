import { createDefaultValidator } from 'api/common.v2/validation/ajvInstances';
import { UserInputSchema } from './userSchemas';
import { UserInputType } from './userTypes';

const validateUserInputSchema = createDefaultValidator<UserInputType>(UserInputSchema);

export { validateUserInputSchema };
