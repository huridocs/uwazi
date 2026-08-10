import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { CreateUserGroupUseCaseFactory } from '#api/core/infrastructure/factories/CreateUserGroupUseCaseFactory.js';
import type {
  CreateUserGroupRequest,
  CreateUserGroupResponse,
} from '#shared/contracts/UserGroups.js';
import { toUpsertDTO } from './UserGroupMapper.js';

const CreateUserGroupRequestSchema = z
  .object({
    name: z.string(),
    members: z.array(z.object({ refId: z.string() }).strict()),
  })
  .strict();

class CreateUserGroupController extends AbstractController<CreateUserGroupRequest> {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    try {
      const dto = CreateUserGroupRequestSchema.parse(this.request.body);

      const created = await CreateUserGroupUseCaseFactory.default().execute({
        name: dto.name,
        memberIds: dto.members.map(member => member.refId),
      });

      const response: CreateUserGroupResponse = toUpsertDTO(created);
      this.response.json(response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      ExecutionContext.logger.info(`User group create failed: ${errorMessage}`, {
        namespace: 'UserGroup_Create',
        success: false,
        notify: true,
        durationMs: Date.now() - startTime,
        error: JSON.stringify(error),
      });

      throw error;
    }
  }
}

export { CreateUserGroupController };
