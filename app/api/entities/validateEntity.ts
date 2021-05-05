import { validateEntitySchema } from './validation/validateEntitySchema';
import { validateEntityData } from './validation/validateEntityData';

export const validateEntity = async (entity: any) => {
  await validateEntitySchema(entity);
  await validateEntityData(entity);
};
