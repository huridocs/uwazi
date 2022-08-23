import util from 'util';
import { isObject, isString } from 'lodash';
import ValidationError from 'ajv/dist/runtime/validation_error';
import { ClientBlobFile } from 'app/istore';

export const isBlobFile = (file: unknown): file is ClientBlobFile =>
  isObject(file) && isString((file as ClientBlobFile).data);

// Thanks to https://stackoverflow.com/questions/54738221/typescript-array-find-possibly-undefind
export function ensure<T>(argument: T | undefined | null | any, message?: string): T {
  if (argument === undefined || argument === null || !(argument as T)) {
    throw new TypeError(message || 'Promised type was not provided!');
  }

  return argument;
}

export function wrapValidator(validator: any) {
  return async (value: any) => {
    try {
      return validator(value);
    } catch (error) {
      if (error as ValidationError) {
        const e = new ValidationError(error.errors);
        e.message = util.inspect(error, false, null);
        e.stack = error.stack;
        throw e;
      }
      throw error;
    }
  };
}

export async function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
