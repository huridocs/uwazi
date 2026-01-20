import { validateEntitySchema } from '#api/entities/validation/validateEntitySchema.js';
import { validateEntityData } from '#api/entities/validation/validateEntityData.js';

export const validateEntity = async entity => {
  await validateEntitySchema(entity);
  await validateEntityData(entity);
};
