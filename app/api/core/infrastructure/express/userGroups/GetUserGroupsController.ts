import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { UserGroupsQueryServiceFactory } from '#api/core/infrastructure/factories/UserGroupsQueryServiceFactory.js';
import type { GetUserGroupsResponse } from '#shared/contracts/UserGroups.js';

class GetUserGroupsController extends AbstractController {
  protected async handle(): Promise<void> {
    const groups = await UserGroupsQueryServiceFactory.default().listUserGroups();

    const response: GetUserGroupsResponse = groups;
    this.response.json(response);
  }
}

export { GetUserGroupsController };
