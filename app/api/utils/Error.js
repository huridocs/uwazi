/**
 * @deprecated
 */
export default function (message, code = 500, logLevel = 'debug') {
  if (code === 500) {
    logLevel = 'error';
  }

  if (message.ajv) {
    return { message: message.message, ...message, code, logLevel };
  }

  if (message instanceof Error) {
    return { message: message.message, stack: message.stack, code, original: message, logLevel };
  }

  return { message, code, logLevel };
}
