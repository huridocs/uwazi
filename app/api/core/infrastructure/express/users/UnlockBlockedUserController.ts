import type {
  UnlockBlockedUserRequest,
  UnlockBlockedUserResponse,
} from '#shared/contracts/Users.js';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { UnlockBlockedUserInputSchema } from '#api/core/application/UnlockBlockedUser.js';
import { UnlockBlockedUserUseCaseFactory } from '../../factories/UnlockBlockedUserUseCaseFactory.js';

class UnlockBlockedUserController extends AbstractController<UnlockBlockedUserRequest> {
  protected async handle(): Promise<void> {
    const input = UnlockBlockedUserInputSchema.parse(this.request.body);

    const useCase = UnlockBlockedUserUseCaseFactory.default();

    await useCase.execute(input);

    const response: UnlockBlockedUserResponse = 'OK';
    this.response.json(response);
  }
}

export { UnlockBlockedUserController };
