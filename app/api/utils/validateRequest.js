import Joi from 'joi';
import objectId from 'joi-objectid';
import createError from './Error';

Joi.objectId = objectId(Joi);

export default (schema, propTovalidate = 'body') => (req, res, next) => {
  const result = Joi.validate(req[propTovalidate], schema);
  if (result.error) {
    next(createError(result.error.toString(), 400));
  }

  if (!result.error) {
    next();
  }
};
