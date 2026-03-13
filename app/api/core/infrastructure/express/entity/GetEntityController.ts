import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { User } from '#api/users.v2/model/User.js';
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
      // Parse and validate query parameters
      const query: GetEntityQuery = GetEntityQuerySchema.parse(this.request.query);

      // Resolve _id to sharedId + language if needed (compatibility layer)
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

      // Validate that we have a sharedId
      if (!resolvedSharedId) {
        this.response.status(400).json({ error: 'sharedId or _id is required' });
        return;
      }

      // Call EntitiesQueryService
      const includeRelationships = !query.omitRelationships;
      const queryService = EntitiesQueryServiceFactory.default();

      // Convert UserSchema to User if authenticated
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

      // Format response
      const includePermissions = query.include.includes('permissions');

      if (!includePermissions) {
        delete entity.permissions;
      }

      // Log success
      logger.info('Entity Get executed successfully', {
        namespace: 'Entity_Get',
        success: true,
        durationMs: Date.now() - startTime,
        sharedId: resolvedSharedId,
        usedIdFallback: !!query._id,
      });

      // Return in V1 format
      this.response.json({ rows: [entity] });
    } catch (error: unknown) {
      const duration = Date.now() - startTime;

      // Handle EntityNotFoundError with 404
      if (error instanceof EntityNotFoundError) {
        logger.info('Entity not found', {
          namespace: 'Entity_Get',
          durationMs: duration,
          success: false,
          notify: false,
          query: JSON.stringify(this.request.query),
        });
        this.response.status(404).json({ rows: [] });
        return;
      }

      // Log full error details including stack trace
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
}

export { GetEntityController };
