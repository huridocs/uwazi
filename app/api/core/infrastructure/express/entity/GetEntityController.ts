import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { User } from '#api/users.v2/model/User.js';
import { AccessLevels } from '#shared/types/permissionSchema.js';
import { EntitiesQueryServiceFactory } from '../../factories/EntitiesQueryServiceFactory.js';
import { getConnection } from '../../mongodb/common/getConnectionForCurrentTenant.js';
import { LoggerFactory } from '../../factories/LoggerFactory.js';
import { EntityNotFoundError } from '../../../domain/entity/errors.js';

const GetEntityQuerySchema = z.object({
  sharedId: z.string().optional(),
  _id: z.string().optional(),
  omitRelationships: z.boolean().optional(),
  include: z
    .array(z.enum(['permissions']))
    .optional()
    .default([]),
});

type GetEntityQuery = z.infer<typeof GetEntityQuerySchema>;

class GetEntityController extends AbstractController<any> {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    const logger = LoggerFactory.default();

    try {
      const query: GetEntityQuery = GetEntityQuerySchema.parse(this.request.query);

      let resolvedSharedId = query.sharedId;
      let resolvedLanguage = this.language;

      if (!query.sharedId && query._id) {
        const { ObjectId } = await import('mongodb');
        const connection = getConnection();
        const entity = await connection
          .collection('entities')
          .findOne({ _id: new ObjectId(query._id) }, { projection: { sharedId: 1, language: 1 } });

        if (!entity) {
          this.response.status(404).json({ rows: [] });
          return;
        }

        resolvedSharedId = entity.sharedId;
        resolvedLanguage = entity.language;
      }

      if (!resolvedSharedId) {
        this.response.status(400).json({ error: 'sharedId or _id is required' });
        return;
      }

      const includeRelationships = !query.omitRelationships;
      const queryService = EntitiesQueryServiceFactory.default();

      const user = this.user
        ? User.createFrom({
            id: (this.user as any)._id?.toString(),
            role: (this.user as any).role,
            groups: ((this.user as any).groups || []).map((g: any) => g._id.toString()),
          })
        : undefined;

      const entity = await queryService.getEntity({
        sharedId: resolvedSharedId,
        language: resolvedLanguage,
        includeRelationships,
        user,
      });

      const includePermissions = query.include.includes('permissions');

      // Security: Filter permissions field based on user authorization (V1 parity)
      if (includePermissions) {
        this.applyPermissionsFieldSecurity(entity, user);
      } else {
        delete entity.permissions;
      }

      logger.info('Entity Get executed successfully', {
        namespace: 'Entity_Get',
        success: true,
        durationMs: Date.now() - startTime,
        sharedId: resolvedSharedId,
        usedIdFallback: !!query._id,
      });

      this.response.json({ rows: [entity] });
    } catch (error: unknown) {
      const duration = Date.now() - startTime;

      if (error instanceof EntityNotFoundError) {
        this.response.status(404).json({ rows: [] });
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.error(`Entity Get failed: ${errorMessage}`, {
        namespace: 'Entity_Get',
        durationMs: duration,
        success: false,
        notify: false,
        errorMessage,
        errorStack,
        errorType: error?.constructor?.name,
        query: JSON.stringify(this.request.query),
      });

      throw error;
    }
  }

  /**
   * Applies permissions field security based on user authorization.
   * Mirrors V1's ModelWithPermissions.controlPermissionsData behavior.
   *
   * @param entity - Entity to filter permissions field
   * @param user - Optional authenticated user
   */
  private applyPermissionsFieldSecurity(entity: any, user?: User): void {
    if (entity.published) {
      return;
    }
    if (!user) {
      // Unauthenticated users never see permissions
      delete entity.permissions;
      return;
    }

    if (user.isPrivileged()) {
      // Admins and editors always see permissions
      return;
    }

    // Non-privileged users: check if they have WRITE access
    if (!this.userHasWriteAccess(entity, user)) {
      delete entity.permissions;
    }
  }

  /**
   * Checks if a user has WRITE access to an entity.
   * Includes checking both direct user permissions and group memberships.
   *
   * @param entity - Entity to check access for
   * @param user - User to check permissions
   * @returns true if user has WRITE access, false otherwise
   */
  private userHasWriteAccess(entity: any, user: User): boolean {
    if (!entity.permissions || !Array.isArray(entity.permissions)) {
      return false;
    }

    // Get all permission IDs (user ID + all group IDs)
    const userPermissionIds = [user._id, ...(user.groups || [])];

    // Check if any of the user's IDs have WRITE level access
    return entity.permissions.some((permission: any) => {
      const refId = permission.refId?.toString?.() || permission.refId;
      return permission.level === AccessLevels.WRITE && userPermissionIds.includes(refId);
    });
  }
}

export { GetEntityController };
