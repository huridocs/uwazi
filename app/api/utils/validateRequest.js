/** @format */

import Ajv from 'ajv';
import Joi from 'joi';
import objectId from 'joi-objectid';
import { wrapValidator } from 'shared/tsUtils';
import createError from './Error';

Joi.objectId = objectId(Joi);
const ajv = Ajv({ allErrors: true });

export default (schema, propTovalidate = 'body') => async (req, _res, next) => {
  if (schema.isJoi) {
    const result = Joi.validate(req[propTovalidate], schema);
    if (result.error) {
      next(createError(result.error.toString(), 400));
    }

    if (!result.error) {
      next();
    }
  } else {
    try {
      const validator = wrapValidator(ajv.compile({ ...schema, $async: true }));
      const result = await validator(req);
      next();
    } catch (e) {
      next(createError(e, 400));
    }
  }
};
