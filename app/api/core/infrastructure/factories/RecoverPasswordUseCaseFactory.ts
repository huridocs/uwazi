import { RecoverPassword } from '#api/core/application/RecoverPassword.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

export class RecoverPasswordUseCaseFactory {
  static default() {
    const useCase = new RecoverPassword({}, { tenant: ExecutionContext.tenant });
    return useCase;
  }
}
