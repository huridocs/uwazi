import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { GetUsersResponse } from '#shared/contracts/Users.js';
import { UsersQueryServiceFactory } from '../../factories/UsersQueryServiceFactory.js';

class GetUsersController extends AbstractController {
  protected async handle(): Promise<void> {
    const queryService = UsersQueryServiceFactory.default();
    const users = await queryService.listUsers();

    // Field-for-field, and deliberately still explicit: UserProfile is the server-side
    // read model and GetUsersResponse is the wire contract, so the two stay free to
    // version independently (D2).
    const response: GetUsersResponse = users.map(user => ({
      _id: user._id,
      username: user.username,
      role: user.role,
      email: user.email,
      groups: user.groups,
      using2fa: user.using2fa,
      accountLocked: user.accountLocked,
    }));

    this.response.json(response);
  }
}

export { GetUsersController };
