export default function(message, code = 500) {
  if (message.ajv) {
    return { ...message, code };
  }

  if (message instanceof Error) {
    return { message: message.message, stack: message.stack, code };
  }

  return { message, code };
}
