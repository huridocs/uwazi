import Ajv from 'ajv';
import { wrapValidator } from 'shared/tsUtils';
import addFormats from 'ajv-formats';
import createError from './Error';

const ajv = new Ajv({ allErrors: true });
ajv.addVocabulary(['tsType']);
const coercedAjv = new Ajv({ allErrors: true, coerceTypes: 'array' });
coercedAjv.addVocabulary(['tsType']);

addFormats(ajv);

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

const createRequestValidator = ajvInstance => schema => async (req, _res, next) => {
  await ajvValidation(ajvInstance, schema, req, next);
};

export const validateAndCoerceRequest = createRequestValidator(coercedAjv);

export default createRequestValidator(ajv);
