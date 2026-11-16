import { GetUserGroupsController } from '#api/core/infrastructure/express/userGroups/GetUserGroupsController.js';

import type { UserGroupsResource } from '../../application/ServerApiClient.js';
import type { UserGroupsResponse } from '../../application/contracts/UserGroups.js';
import type { ControllerInvoker } from '../ControllerInvoker.js';

class UserGroupsClient implements UserGroupsResource {
  constructor(private readonly invoker: ControllerInvoker) {}

  async getAll() {
    return this.invoker.invoke<UserGroupsResponse>(GetUserGroupsController, {
      method: 'GET',
      path: '/api/usergroups',
    });
  }
}

export { UserGroupsClient };
