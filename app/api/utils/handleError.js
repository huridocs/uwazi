import debugLog from 'api/log/debugLog';
import errorLog from 'api/log/errorLog';
import Ajv from 'ajv';

const ajvPrettifier = error => {
  const errorMessage = [error.message];
  if (error.errors && error.errors.length) {
    error.errors.forEach(oneError => {
      errorMessage.push(`${oneError.dataPath}: ${oneError.message}`);
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

  const errorMessage = `${url}${body}${query}${errorString}`;

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

  return result;
};

const getOriginalError = (data, error) => {
  const original = data.original || error;

  if (original instanceof Error) {
    return original;
  }

  return null;
};

const sendLog = (data, error, errorOptions) => {
  const originalError = getOriginalError(data, error);
  if (data.code === 500) {
    errorLog.error(
      originalError ? appendOriginalError(data.prettyMessage, originalError) : data.prettyMessage,
      errorOptions
    );
  } else if (data.code === 400) {
    debugLog.debug(
      originalError ? appendOriginalError(data.prettyMessage, originalError) : data.prettyMessage,
      errorOptions
    );
  }
};

export default (_error, { req = undefined, uncaught = false } = {}) => {
  const error = _error || new Error('undefined error occurred');
  const responseToClientError = error.json;

  if (responseToClientError) {
    return false;
  }

  const result = prettifyError(error, { req, uncaught });

  const errorOptions = req ? { shouldBeMultiTenantContext: true } : {};
  sendLog(result, error, errorOptions);

  delete result.original;

  return result;
};

export { prettifyError };
