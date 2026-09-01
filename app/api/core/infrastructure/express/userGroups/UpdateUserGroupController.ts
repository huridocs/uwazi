import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { UpdateUserGroupUseCaseFactory } from '#api/core/infrastructure/factories/UpdateUserGroupUseCaseFactory.js';
import { IdSchema } from '#api/core/libs/Id.js';
import type {
  UpdateUserGroupRequest,
  UpdateUserGroupResponse,
} from '#shared/contracts/UserGroups.js';

const UpdateUserGroupRequestSchema = z.object({
  _id: IdSchema,
  name: z.string().trim(),
  members: z.array(z.object({ refId: IdSchema })),
});

class UpdateUserGroupController extends AbstractController<UpdateUserGroupRequest> {
  protected async handle(): Promise<void> {
    const dto = UpdateUserGroupRequestSchema.parse(this.request.body);

    const updated = await UpdateUserGroupUseCaseFactory.default().execute({
      id: dto._id,
      name: dto.name,
      memberIds: dto.members.map(member => member.refId),
    });

    const response: UpdateUserGroupResponse = {
      _id: updated.id,
      name: updated.name,
      members: updated.memberIds.map(refId => ({ refId })),
    };

    this.response.json(response);
  }
}

export { UpdateUserGroupController };
