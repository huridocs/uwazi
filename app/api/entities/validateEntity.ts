import { validateEntitySchema } from './validation/validateEntitySchema';
import { validateEntityData } from './validation/validateEntityData';

// @ts-expect-error TS(7006): Parameter 'entity' implicitly has an 'any' type.
export const validateEntity = async entity => {
  await validateEntitySchema(entity);
  await validateEntityData(entity);
};
