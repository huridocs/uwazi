import type { CliContext } from './CliContext.js';
import type { Middleware } from './Middleware.js';

/** Runs middlewares in order; each decides whether and when the rest of the chain runs. */
class Pipeline {
  constructor(private readonly middlewares: Middleware[]) {}

  async run(context: CliContext): Promise<void> {
    let lastCalled = -1;

    const dispatch = async (index: number): Promise<void> => {
      if (index <= lastCalled) {
        throw new Error('next() called more than once');
      }
      lastCalled = index;

      const middleware = this.middlewares[index];
      if (!middleware) return;

      await middleware.handle(context, async () => dispatch(index + 1));
    };

    await dispatch(0);
  }
}

export { Pipeline };
