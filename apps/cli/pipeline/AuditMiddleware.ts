import type { AuditRecorder } from './AuditRecorder.js';
import type { CliContext } from './CliContext.js';
import type { Middleware } from './Middleware.js';

/**
 * The audit slot of the pipeline. Without a recorder it only passes through; auditing CLI
 * operations later means providing an AuditRecorder, not touching the routes.
 */
class AuditMiddleware implements Middleware {
  constructor(private readonly recorder?: AuditRecorder) {}

  async handle(context: CliContext, next: () => Promise<void>): Promise<void> {
    const { route, input } = context;

    try {
      await next();
    } catch (error) {
      await this.recorder?.record({ route, input, outcome: 'failure', error });
      throw error;
    }

    await this.recorder?.record({ route, input, outcome: 'success' });
  }
}

export { AuditMiddleware };
