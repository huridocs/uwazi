import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { User } from '#api/users.v2/model/User.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';

/** Resolves actor/tenant for page use cases. HTTP middleware sets ExecutionContext.actor; fallback is for jobs/tests only. */
export function pageUseCaseExecutionContext() {
  const { tenant } = ExecutionContext;

  let actor: User;
  try {
    actor = ExecutionContext.actor!;
  } catch {
    // Jobs/tests without ExecutionContext.actor
    actor = User.createFrom(permissionsContext.getUserInContext() ?? null);
  }

  return { actor, tenant };
}
