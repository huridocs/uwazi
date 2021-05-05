/* eslint-disable max-statements */
import Ajv from 'ajv';
import { wrapValidator } from 'shared/tsUtils';
import { connectionSchema } from 'shared/types/connectionSchema';

const ajv = Ajv({ allErrors: true });

export const validateConnectionSchema = wrapValidator(
  ajv.compile({ $async: true, type: 'array', items: connectionSchema })
);
