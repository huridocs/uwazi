export default function formatMessage(info, instanceName) {
  let message = info.message;
  if (info.message && info.message.join) {
    message = info.message.join('\n');
  }

  const result = `${info.timestamp} [${instanceName}] ${message}`;

  return result;
}
