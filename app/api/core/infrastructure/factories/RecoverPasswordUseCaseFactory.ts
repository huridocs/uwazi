import {
  RecoverPassword,
  RecoverPasswordDependencies,
} from '#api/core/application/RecoverPassword.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { DispatcherAdapter } from '../jobs/DispatcherAdapter.js';

export class RecoverPasswordUseCaseFactory {
  static default(overrides?: Partial<RecoverPasswordDependencies>) {
    const useCase = new RecoverPassword(
      {
        dispatcher: new DispatcherAdapter(
          DefaultDispatcher(ExecutionContext.tenant.name, ExecutionContext.transactionManager)
        ),
        ...overrides,
      },
      { tenant: ExecutionContext.tenant }
    );
    return useCase;
  }
}
