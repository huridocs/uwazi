import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { GetEntityUseCaseFactory } from '../../factories/GetEntityUseCaseFactory.js';
import { getConnection } from '../../mongodb/common/getConnectionForCurrentTenant.js';
import { LoggerFactory } from '../../factories/LoggerFactory.js';

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

      // Call GetEntity use case
      const includeRelationships = !query.omitRelationships;
      const useCase = GetEntityUseCaseFactory.default(resolvedLanguage, (this.user as any) || null);
      const result = await useCase.execute({
        sharedId: resolvedSharedId,
        includeRelationships,
      });

      // Handle not found
      if (result.isError()) {
        this.response.status(404).json({ rows: [] });
        return;
      }

      // Format response
      const entity = result.getDataOrThrow();
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

      logger.info(
        `Entity Get failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace: 'Entity_Get',
          durationMs: duration,
          success: false,
          notify: false,
          error: JSON.stringify(error),
          query: JSON.stringify(this.request.query),
        }
      );

      throw error;
    }
  }
}

export { GetEntityController };
