import type { Request, Response } from 'express';

import type { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';

type Rejection = { status: number; body: unknown };

type Guard = (request: Request) => Promise<Rejection | undefined> | Rejection | undefined;

type ControllerTransport = { request: Request; response: Response };

/**
 * Wraps a controller's `handle` so `guard` runs first. A returned rejection is written to the
 * response and `handle` is skipped; a thrown error propagates to the error middleware.
 */
export function guardHandle(guard: Guard) {
  return function decorate(
    _target: AbstractController,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const handle = descriptor.value as (this: AbstractController) => Promise<void>;

    return {
      ...descriptor,
      async value(this: AbstractController) {
        const { request, response } = this as unknown as ControllerTransport;
        const rejection = await guard(request);

        if (rejection) {
          response.status(rejection.status).json(rejection.body);
          return undefined;
        }

        return handle.call(this);
      },
    };
  };
}
