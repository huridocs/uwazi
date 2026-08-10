import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UpdateUserGroupUseCaseFactory } from '#api/core/infrastructure/factories/UpdateUserGroupUseCaseFactory.js';
import { toUpsertDTO } from './UserGroupMapper.js';

const UpdateUserGroupRequestSchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    members: z.array(z.object({ refId: z.string() }).strict()),
  })
  .strict();

class UpdateUserGroupController extends AbstractController {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    try {
      const dto = UpdateUserGroupRequestSchema.parse(this.request.body);

      const updated = await UpdateUserGroupUseCaseFactory.default().execute({
        id: dto._id,
        name: dto.name,
        memberIds: dto.members.map(member => member.refId),
      });

      this.response.json(toUpsertDTO(updated));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      ExecutionContext.logger.info(`User group update failed: ${errorMessage}`, {
        namespace: 'UserGroup_Update',
        success: false,
        notify: true,
        durationMs: Date.now() - startTime,
        errorMessage,
        errorStack,
        errorType: error?.constructor?.name,
        dto: JSON.stringify(this.request.body),
        tenantName: ExecutionContext.currentTenant.name,
        actorId: this.user._id,
        correlationId: ExecutionContext.correlationId,
      });

      throw error;
    }
  }
}

export { UpdateUserGroupController };
