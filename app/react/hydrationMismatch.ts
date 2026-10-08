const isHydrationMismatch = (error: unknown) =>
  error instanceof Error &&
  (error.message.startsWith('Hydration failed because the server rendered') ||
    error.message.startsWith('Minified React error #418;'));

const onRecoverableError = (error: unknown) => {
  if (isHydrationMismatch(error)) return;
  reportError(error);
};

export { isHydrationMismatch, onRecoverableError };
