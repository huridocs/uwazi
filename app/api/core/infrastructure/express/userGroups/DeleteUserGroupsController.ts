import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { DeleteUserGroupsUseCaseFactory } from '#api/core/infrastructure/factories/DeleteUserGroupsUseCaseFactory.js';
import { IdListQuerySchema } from '#api/core/libs/Id.js';
import type { DeleteUserGroupsResponse } from '#shared/contracts/UserGroups.js';

const DeleteUserGroupsQuerySchema = z.object({ ids: IdListQuerySchema });

class DeleteUserGroupsController extends AbstractController {
  protected async handle(): Promise<void> {
    const parsed = DeleteUserGroupsQuerySchema.parse(this.request.query);

    const response: DeleteUserGroupsResponse =
      await DeleteUserGroupsUseCaseFactory.default().execute({
        ids: parsed.ids,
      });

    this.response.json(response);
  }
}

export { DeleteUserGroupsController };
