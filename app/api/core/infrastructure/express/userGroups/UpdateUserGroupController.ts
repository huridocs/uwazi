import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UpdateUserGroupUseCaseFactory } from '#api/core/infrastructure/factories/UpdateUserGroupUseCaseFactory.js';
import type {
  UpdateUserGroupRequest,
  UpdateUserGroupResponse,
} from '#shared/contracts/UserGroups.js';

// strict() at the top level: the v2 POST /api/usergroups route has no validation middleware,
// so this schema is the only thing rejecting unknown body fields. The member objects stay
// lenient on purpose — GET returns members enriched with username/role/email and the client
// posts { refId, username } back, so extra member keys are stripped rather than rejected.
const UpdateUserGroupRequestSchema = z
  .object({
    _id: z.string(),
    name: z.string().trim(),
    members: z.array(z.object({ refId: z.string() })),
  })
  .strict();

class UpdateUserGroupController extends AbstractController<UpdateUserGroupRequest> {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    try {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      ExecutionContext.logger.info(`User group update failed: ${errorMessage}`, {
        namespace: 'UserGroup_Update',
        success: false,
        notify: true,
        durationMs: Date.now() - startTime,
        error: JSON.stringify(error),
      });

      throw error;
    }
  }
}

export { UpdateUserGroupController };
