/* eslint-disable prefer-template */
import debugLog from 'api/log/debugLog';
import errorLog from 'api/log/errorLog';

export default (error, { req = {}, uncaught = false } = {}) => {
  let result = error;
  const responseToClientError = error.json;

  if (responseToClientError) {
    return false;
  }

  if (error instanceof Error) {
    result = { code: 500, message: error.stack };
  }

  if (error.name === 'MongoError') {
    result.code = 500;
  }

  if (error.message.match(/Cast to ObjectId failed for value/)) {
    result.code = 400;
  }

  if (uncaught) {
    result.message = `uncaught exception or unhandled rejection, Node process finished !!\n ${result.message}`;
  }


  const errorMessage = (req.originalUrl ? `\nurl: ${req.originalUrl}` : '') +
    (req.body && Object.keys(req.body).length ? `\nbody: ${JSON.stringify(req.body, null, ' ')}` : '') +
    (req.query && Object.keys(req.query).length ? `\nquery: ${JSON.stringify(req.query, null, ' ')}` : '') +
    `\n${result.message}`;

  if (result.code === 500) {
    errorLog.error(errorMessage);
  }

  if (result.code === 400) {
    debugLog.debug(errorMessage);
  }

  return result;
};
