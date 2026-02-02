import { validateEntitySchema } from './validation/validateEntitySchema.js';
import { validateEntityData } from './validation/validateEntityData.js';

export const validateEntity = async (entity: any) => {
  await validateEntitySchema(entity);
  await validateEntityData(entity);
};
