import Ajv from 'ajv';
import { entitySchema } from '#shared/types/entitySchema.js';
import { wrapValidator } from '#shared/tsUtils.js';

const ajv = new Ajv({ allErrors: true });
ajv.addVocabulary(['tsType']);

export const validateEntitySchema = async (entity: any) =>
  wrapValidator(ajv.compile(entitySchema))(entity);
