/* eslint-disable prefer-template */
import debugLog from 'api/log/debugLog';
import errorLog from 'api/log/errorLog';

const prettifyError = (error, { req = {}, uncaught = false } = {}) => {
  let result = error;

  if (error instanceof Error) {
    result = { code: 500, message: error.stack };
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

  if (req.body && req.body.password) {
    req.body.password = '########';
  }

  if (req.body && req.body.username) {
    req.body.username = '########';
  }

  const errorMessage = (req.originalUrl ? `\nurl: ${req.originalUrl}` : '') +
    (req.body && Object.keys(req.body).length ? `\nbody: ${JSON.stringify(req.body, null, ' ')}` : '') +
    (req.query && Object.keys(req.query).length ? `\nquery: ${JSON.stringify(req.query, null, ' ')}` : '') +
    `\n${result.message || JSON.stringify(error.json)}`;

  result.prettyMessage = errorMessage;
  return result;
};

export default (error, { req = {}, uncaught = false } = {}) => {
  const responseToClientError = error.json;

  if (responseToClientError) {
    return false;
  }

  const result = prettifyError(error, { req, uncaught });

  if (result.code === 500) {
    errorLog.error(result.prettyMessage);
  }

  if (result.code === 400) {
    debugLog.debug(result.prettyMessage);
  }

  return result;
};

export { prettifyError };
