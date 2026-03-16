import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
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

      const user = this.user;

      const queryService = EntitiesQueryServiceFactory.default(user);

      const entity = await queryService.getEntity({
        sharedId: resolvedSharedId,
        language: resolvedLanguage,
        includeRelationships: !query.omitRelationships,
        includePermissions: query.include.includes('permissions'),
        user,
      });

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
}

export { GetEntityController };
