export default function(message, code = 500) {
  if (message instanceof Error) {
    return { ...message, code };
  }

  return { message, code };
}
