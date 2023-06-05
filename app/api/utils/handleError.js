import { errorLog, debugLog } from 'api/log';
import Ajv from 'ajv';
import { createError } from 'api/utils/index';
import { appContext } from 'api/utils/AppContext';
import { UnauthorizedError } from 'api/authorization.v2/errors/UnauthorizedError';
import { ValidationError } from 'api/common.v2/validation/ValidationError';

const ajvPrettifier = error => {
  const errorMessage = [error.message];
  if (error.validations && error.validations.length) {
    error.validations.forEach(oneError => {
      errorMessage.push(`${oneError.instancePath}: ${oneError.message}`);
    });
  }
  return errorMessage.join('\n');
};

const joiPrettifier = (error, req) => {
  const url = req.originalUrl ? `\nurl: ${req.originalUrl}` : '';
  const body =
    req.body && Object.keys(req.body).length
      ? `\nbody: ${JSON.stringify(req.body, null, ' ')}`
      : '';
  const query =
    req.query && Object.keys(req.query).length
      ? `\nquery: ${JSON.stringify(req.query, null, ' ')}`
      : '';
  const errorString = `\n${error.message || JSON.stringify(error.json)}`;

  let errorMessage = `${url}${body}${query}${errorString}`;

  //if the resulting message is empty, or meaningless combination of characters ('{}')
  if (errorMessage.match(/^[{}\s]*$/g)) {
    errorMessage = JSON.stringify(error, null, 2);
  }

  return errorMessage;
};

const appendOriginalError = (message, originalError) =>
  `${message}\noriginal error: ${JSON.stringify(originalError, null, ' ')}`;

const obfuscateCredentials = req => {
  const obfuscated = req;
  if (req.body && req.body.password) {
    obfuscated.body.password = '########';
  }

  if (req.body && req.body.username) {
    obfuscated.body.username = '########';
  }

  return obfuscated;
};

// eslint-disable-next-line max-statements
const prettifyError = (error, { req = {}, uncaught = false } = {}) => {
  let result = error;

  if (error instanceof Error) {
    result = { code: 500, message: error.stack };
  }

  if (error instanceof Ajv.ValidationError) {
    result = { code: 422, message: error.message, validations: error.errors };
  }

  if (error.name === 'ValidationError') {
    result = { code: 422, message: error.message, validations: error.properties };
  }

  if (error instanceof ValidationError) {
    result = { code: 422, message: error.message, validations: error.errors };
  }

  if (error instanceof UnauthorizedError) {
    result = { code: 401, message: error.message };
  }

  if (error.name === 'MongoError') {
    result.code = 500;
  }

  if (error.message && error.message.match(/Cast to ObjectId failed for value/)) {
    result.code = 400;
  }

  if (error.message && error.message.match(/rison decoder error/)) {
    result.code = 400;
  }

  if (uncaught) {
    result.message = `uncaught exception or unhandled rejection, Node process finished !!\n ${result.message}`;
  }

  const obfuscatedRequest = obfuscateCredentials(req);
  result.prettyMessage = error.ajv
    ? ajvPrettifier(result)
    : joiPrettifier(result, obfuscatedRequest);
  result.message = error.ajv ? result.prettyMessage : result.message;

  return result;
};

const getErrorMessage = (data, error) => {
  const originalError = data.original || error;
  const prettyMessage = data.requestId
    ? `requestId: ${data.requestId} ${data.prettyMessage}`
    : data.prettyMessage;

  if (originalError instanceof Error) {
    const extendedError = appendOriginalError(prettyMessage, originalError);
    return data.tenantError
      ? `${extendedError}\n[Tenant error] ${data.tenantError.message}`
      : extendedError;
  }

  return prettyMessage;
};

const sendLog = (data, error, errorOptions) => {
  const messageToLog = getErrorMessage(data, error);
  if (data.code === 500) {
    errorLog.error(messageToLog, errorOptions);
  } else if (data.code === 400) {
    debugLog.debug(messageToLog, errorOptions);
  }
};

function setRequestId(result) {
  try {
    return { ...result, requestId: appContext.get('requestId') };
  } catch (err) {
    return { ...result, tenantError: err };
  }
}

const postProcessError = (error, original) => {
  const result = { ...error };
  delete result.original;
  if (result.code === 500 && original.name !== 'MongoError') {
    delete result.message;
    result.prettyMessage = original.message;
  }
  return result;
};

const handleError = (_error, { req = {}, uncaught = false, useContext = true } = {}) => {
  const errorData = typeof _error === 'string' ? createError(_error, 500) : _error;

  const error = errorData || new Error('Unexpected error has occurred');
  let result = prettifyError(error, { req, uncaught });

  if (useContext) {
    result = setRequestId(result);
  }

  sendLog(result, error, {});

  result = postProcessError(result, error);

  return result;
};

export { handleError, prettifyError };
