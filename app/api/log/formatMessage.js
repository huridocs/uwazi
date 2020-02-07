export default function formatMessage(info, instanceName) {
  const message = info.message && info.message.join ? info.message.join('\n') : info.message;

  const result = `${info.timestamp} [${instanceName}] ${message}`;

  return result;
}
