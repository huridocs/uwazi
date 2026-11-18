import { ajv, coercedAjv, validateWith } from '#api/utils/validateRequest.js';

import { guardHandle } from './guardHandle.js';

type Options = { coerce?: boolean };

/**
 * Controller counterpart of `validation.validateRequest` / `validateAndCoerceRequest`
 * (app/api/utils/validateRequest.js): validates the whole request and throws the same 400 error.
 * Pass a module-level schema: Ajv caches compiled schemas by object identity.
 */
export function ValidateRequest(schema: object, { coerce = false }: Options = {}) {
  return guardHandle(async request => {
    await validateWith(coerce ? coercedAjv : ajv, schema, request);
    return undefined;
  });
}
