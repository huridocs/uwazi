import Ajv from 'ajv';
import { entitySchema } from 'shared/types/entitySchema';
import { wrapValidator } from 'shared/tsUtils';

const ajv = Ajv({ allErrors: true });

export const validateEntitySchema = async (entity: any) =>
  wrapValidator(ajv.compile(entitySchema))(entity);
