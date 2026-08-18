import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { CreateUserGroupUseCaseFactory } from '#api/core/infrastructure/factories/CreateUserGroupUseCaseFactory.js';
import type {
  CreateUserGroupRequest,
  CreateUserGroupResponse,
} from '#shared/contracts/UserGroups.js';

// strict() at the top level: the v2 POST /api/usergroups route has no validation middleware,
// so this schema is the only thing rejecting unknown body fields. The member objects stay
// lenient on purpose — GET returns members enriched with username/role/email and the client
// posts { refId, username } back, so extra member keys are stripped rather than rejected.
const CreateUserGroupRequestSchema = z
  .object({
    name: z.string().trim(),
    members: z.array(z.object({ refId: z.string() })),
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

      const response: CreateUserGroupResponse = {
        _id: created.id,
        name: created.name,
        members: created.memberIds.map(refId => ({ refId })),
      };

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
