/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { performance } from 'perf_hooks';
import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { appContext } from '#api/utils/AppContext.js';
import { EntityNotFoundError } from '../../../domain/entity/errors.js';
import type { GetEntityPerformance } from '../../../application/EntitiesQueryService.js';
import { EntitiesQueryServiceFactory } from '../../factories/EntitiesQueryServiceFactory.js';
import { LoggerFactory } from '../../factories/LoggerFactory.js';
import { getConnection } from '../../mongodb/common/getConnectionForCurrentTenant.js';

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

const DEFAULT_PERFORMANCE_THRESHOLD_MS = 500;

type Logger = ReturnType<typeof LoggerFactory.default>;

function maybeLogEntityGetPerformance(input: {
  logger: Logger;
  totalMs: number;
  resolveIdMs: number;
  serializeMs: number;
  phases: GetEntityPerformance;
  sharedId: string;
  language: string;
  omitRelationships: boolean;
  includePermissions: boolean;
  payload: { rows: unknown[] };
}): void {
  const flag = tenants.current().featureFlags?.logPerformanceEntities;
  const enabled = flag?.enabled === true;
  const thresholdMs = flag?.thresholdMs ?? DEFAULT_PERFORMANCE_THRESHOLD_MS;

  if (!enabled || input.totalMs < thresholdMs) {
    return;
  }

  let requestId: unknown;
  try {
    requestId = appContext.get('requestId');
  } catch {
    requestId = undefined;
  }

  input.logger.info('Entity GET phases', {
    namespace: 'Entity_Get_Phases',
    sharedId: input.sharedId,
    language: input.language,
    omitRelationships: input.omitRelationships,
    includePermissions: input.includePermissions,
    relatedCount: input.phases.relatedCount,
    relationshipPropValueCount: input.phases.relationshipPropValueCount,
    responseBytes: Buffer.byteLength(JSON.stringify(input.payload)),
    resolveIdMs: Math.round(input.resolveIdMs),
    entityLoadMs: Math.round(input.phases.entityLoadMs),
    permFilterMs: Math.round(input.phases.permFilterMs),
    relationsMs: Math.round(input.phases.relationsMs),
    serializeMs: Math.round(input.serializeMs),
    totalMs: Math.round(input.totalMs),
    thresholdMs,
    requestId,
  });
}

class GetEntityController extends AbstractController<any> {
  protected async handle(): Promise<void> {
    const startTime = performance.now();
    const logger = LoggerFactory.default();
    let resolveIdMs = 0;

    try {
      const query: GetEntityQuery = GetEntityQuerySchema.parse(this.request.query);

      let resolvedSharedId = query.sharedId;
      let resolvedLanguage = this.language;

      if (!query.sharedId && query._id) {
        const resolveIdStart = performance.now();
        const connection = getConnection();
        const entity = await connection
          .collection('entities')
          .findOne({ _id: new ObjectId(query._id) }, { projection: { sharedId: 1, language: 1 } });
        resolveIdMs = performance.now() - resolveIdStart;

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

      const { user } = this;
      const omitRelationships = Boolean(query.omitRelationships);
      const includePermissions = query.include.includes('permissions');

      const queryService = EntitiesQueryServiceFactory.default(user);

      const { entity, phases } = await queryService.getEntity({
        sharedId: resolvedSharedId,
        language: resolvedLanguage,
        includeRelationships: !omitRelationships,
        includePermissions,
        user,
      });

      const payload = { rows: [entity] };

      const serializeStart = performance.now();
      this.response.json(payload);
      const serializeMs = performance.now() - serializeStart;

      maybeLogEntityGetPerformance({
        logger,
        totalMs: performance.now() - startTime,
        resolveIdMs,
        serializeMs,
        phases,
        sharedId: resolvedSharedId,
        language: resolvedLanguage,
        omitRelationships,
        includePermissions,
        payload,
      });
    } catch (error: unknown) {
      const duration = performance.now() - startTime;

      if (error instanceof EntityNotFoundError) {
        this.response.status(404).json({ rows: [] });
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.info(`Entity Get failed: ${errorMessage}`, {
        namespace: 'Entity_Get',
        durationMs: Math.round(duration),
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
