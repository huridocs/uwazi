/* eslint-disable max-statements */
import Ajv from 'ajv';
import { wrapValidator } from 'shared/tsUtils';
import { connectionSchema } from 'shared/types/connectionSchema';

const ajv = new Ajv({ allErrors: true });
ajv.addVocabulary(['tsType']);

export const validateConnectionSchema = wrapValidator(
  ajv.compile({ $async: true, type: 'array', items: connectionSchema })
);
