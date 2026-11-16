import { GetCurrentUserController } from '#api/core/infrastructure/express/users/GetCurrentUserController.js';
import { GetUsersController } from '#api/core/infrastructure/express/users/GetUsersController.js';

import type { UsersResource } from '../../application/ServerApiClient.js';
import type { CurrentUserResponse, UsersResponse } from '../../application/contracts/Users.js';
import type { ControllerInvoker } from '../ControllerInvoker.js';

class UsersClient implements UsersResource {
  constructor(private readonly invoker: ControllerInvoker) {}

  async getAll() {
    return this.invoker.invoke<UsersResponse>(GetUsersController, {
      method: 'GET',
      path: '/api/users',
    });
  }

  async getCurrent() {
    return this.invoker.invoke<CurrentUserResponse>(GetCurrentUserController, {
      method: 'GET',
      path: '/api/user',
    });
  }
}

export { UsersClient };
