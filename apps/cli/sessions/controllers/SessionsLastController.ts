import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { ActivityReaderFactory } from '#usage';
import type { SessionsLastOutput } from '../contracts.js';

class SessionsLastController {
  static async handle(): Promise<SessionsLastOutput> {
    const lastSession = await ActivityReaderFactory.default().lastSession(
      ExecutionContext.currentTenant.name
    );

    return { lastSession: lastSession ?? 0 };
  }
}

export { SessionsLastController };
