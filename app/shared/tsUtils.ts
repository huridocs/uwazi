import util from 'util';
import { isObject, isString } from 'lodash';
import ValidationError from 'ajv/dist/runtime/validation_error';
import { ClientBlobFile } from 'app/istore';

export type Subset<K, T extends K> = T;

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

export function syncWrapValidator(validator: any) {
  return (value: any) => {
    const valid = validator(value);

    if (!valid) {
      const { errors } = validator;
      const e = new ValidationError(errors);
      e.message = errors
        .map(
          ({ instancePath, message }: { instancePath: string; message: string }) =>
            `${instancePath}: ${message}`
        )
        .join('/n');
      throw e;
    }

    return valid;
  };
}

export async function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
