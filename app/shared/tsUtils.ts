/** @format */

// Thanks to https://stackoverflow.com/questions/54738221/typescript-array-find-possibly-undefind
export function ensure<T>(argument: T | undefined | null | any, message?: string): T {
  if (argument === undefined || argument === null || !(argument as T)) {
    throw new TypeError(message || 'Promised type was not provided!');
  }

  return argument;
}
