import type { CliContext } from './CliContext.js';

interface Middleware {
  handle(context: CliContext, next: () => Promise<void>): Promise<void>;
}

export type { Middleware };
