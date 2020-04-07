export default function(message, code = 500) {
  if (message instanceof Error) {
    return { ...message, code, stack: message.stack };
  }

  return { message, code };
}
