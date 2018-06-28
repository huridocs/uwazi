export default function formatMessage(info, instanceName) {
  const message = (typeof info.message === 'object')
    ? info.message.join('\n') : info.message;

  const result = `${info.timestamp} [${instanceName}] ${message}`;

  return result;
}
