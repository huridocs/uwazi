import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { z } from 'zod';
import { EntityNotFoundError } from '../../../domain/entity/errors.js';
import { EntitiesQueryServiceFactory } from '../../factories/EntitiesQueryServiceFactory.js';
import { LoggerFactory } from '../../factories/LoggerFactory.js';
import { EntitiesDAOFactory } from '../../factories/EntitiesDAOFactory.js';

const GetEntityQuerySchema = z.object({
  sharedId: z.string().optional(),
  _id: z.string().optional(),
  omitRelationships: z.boolean().optional(),
  // When true, the returned entity.relations only includes relationships whose
  // target entity is referenced by a relationship property in the entity metadata.
  // This flag overrides omitRelationships.
  includeMetadataRelationships: z.boolean().optional(),
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
        const entityDAO = EntitiesDAOFactory.default({ user: this.user });
        const entity = await entityDAO.getByInternalId(query._id, {
          sharedId: 1,
          language: 1,
        });

        if (!entity) {
          this.response.status(404).json({ rows: [] });
          return;
        }

        resolvedSharedId = entity.sharedId;
        resolvedLanguage = entity.language as LanguageISO6391;
      }

      if (!resolvedSharedId) {
        this.response.status(400).json({ error: 'sharedId or _id is required' });
        return;
      }

      const user = this.user;

      const queryService = EntitiesQueryServiceFactory.default(user);

      const scopeRelationshipsToMetadata = query.includeMetadataRelationships === true;

      const entity = await queryService.getEntity({
        sharedId: resolvedSharedId,
        language: resolvedLanguage,
        includeRelationships: scopeRelationshipsToMetadata || !query.omitRelationships,
        includePermissions: query.include.includes('permissions'),
        scopeRelationshipsToMetadata,
        user,
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

      logger.info(`Entity Get failed: ${errorMessage}`, {
        namespace: 'Entity_Get',
        durationMs: duration,
        success: false,
        notify: true,
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
