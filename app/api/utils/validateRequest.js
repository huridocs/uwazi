import Ajv from 'ajv';
import Joi from 'joi';
import objectId from 'joi-objectid';
import { wrapValidator } from 'shared/tsUtils';
import addFormats from 'ajv-formats';
import createError from './Error';

Joi.objectId = objectId(Joi);

const ajv = new Ajv({ allErrors: true });
ajv.addVocabulary(['tsType']);
const coercedAjv = new Ajv({ allErrors: true, coerceTypes: 'array' });
coercedAjv.addVocabulary(['tsType']);

addFormats(ajv);

const JoiDeprecatedValidation = (schema, propTovalidate, req, next) => {
  const result = Joi.validate(req[propTovalidate], schema);
  if (result.error) {
    next(createError(result.error.toString(), 400));
  }

  if (!result.error) {
    next();
  }
};

const ajvValidation = async (ajvInstance, schema, req, next) => {
  try {
    // do not create a new schema based of this one, this creates a memory leak
    // https://ajv.js.org/guide/managing-schemas.html#using-ajv-instance-cache
    // eslint-disable-next-line no-param-reassign
    schema.$async = true;
    //
    const validator = wrapValidator(ajvInstance.compile(schema));
    await validator(req);
    next();
  } catch (e) {
    next(createError(e, 400));
  }
};

const createRequestValidator =
  ajvInstance =>
  (schema, propTovalidate = 'body') =>
  async (req, _res, next) => {
    if (schema.isJoi) {
      JoiDeprecatedValidation(schema, propTovalidate, req, next);
      return;
    }

    await ajvValidation(ajvInstance, schema, req, next);
  };

export const validateAndCoerceRequest = createRequestValidator(coercedAjv);

export default createRequestValidator(ajv);
