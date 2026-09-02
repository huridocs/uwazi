import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { CreateUserGroupUseCaseFactory } from '#api/core/infrastructure/factories/CreateUserGroupUseCaseFactory.js';
import { IdSchema } from '#api/core/libs/Id.js';
import type {
  CreateUserGroupRequest,
  CreateUserGroupResponse,
} from '#shared/contracts/UserGroups.js';

const CreateUserGroupRequestSchema = z.object({
  name: z.string().trim(),
  members: z.array(z.object({ refId: IdSchema })),
});

class CreateUserGroupController extends AbstractController<CreateUserGroupRequest> {
  protected async handle(): Promise<void> {
    const dto = CreateUserGroupRequestSchema.parse(this.request.body);

    const created = await CreateUserGroupUseCaseFactory.default().execute({
      name: dto.name,
      memberIds: dto.members.map(member => member.refId),
    });

    const response: CreateUserGroupResponse = {
      _id: created.id,
      name: created.name,
      members: created.memberIds.map(refId => ({ refId })),
    };

    this.response.json(response);
  }
}

export { CreateUserGroupController };
