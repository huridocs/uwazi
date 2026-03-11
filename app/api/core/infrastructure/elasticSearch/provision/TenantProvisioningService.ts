import { Client } from '@elastic/elasticsearch';
import { TenantIndexResolver } from '../TenantIndexResolver';
import { TenantRoutingRepository } from '../TenantRoutingRepository';
import {
  ProvisioningResult,
  GroupAlreadyExistsError,
  GroupNotFoundError,
  TenantAlreadyInGroupError,
  IndexDefinition,
} from '../Types';
import { GroupAliasNameBuilder } from './GroupAliasNameBuilder';

type Deps = {
  esClient: Client;
  registry: Record<string, IndexDefinition>;
  routingRepository: TenantRoutingRepository;
  resolver: TenantIndexResolver;
};

class TenantProvisioningService {
  constructor(private deps: Deps) {}

  async createGroup(groupName: string, logicalName: string): Promise<ProvisioningResult> {
    const startMs = Date.now();
    const definition = this.deps.registry[logicalName];
    if (!definition) throw new Error(`Unknown logical index "${logicalName}"`);

    const alias = GroupAliasNameBuilder.toAlias(groupName, logicalName);
    const physicalIndex = GroupAliasNameBuilder.createInitialPhysicalIndex(groupName, logicalName);

    const aliasExists = await this.deps.esClient.indices.existsAlias({ name: alias });
    if (aliasExists.body) throw new GroupAlreadyExistsError(groupName, alias);

    await this.deps.esClient.indices.create({
      index: physicalIndex,
      body: {
        settings: definition.settings,
        mappings: definition.mappings,
        aliases: { [alias]: {} },
      },
    });

    return {
      success: true,
      operation: 'create-group',
      details: { groupName, logicalName, alias, physicalIndex },
      durationMs: Date.now() - startMs,
    };
  }

  /**
   * Assigns a tenant to an index group by copying their documents to the group alias.
   *
   * Steps are intentionally ordered for idempotency: the routing record is committed (step 9)
   * before the source documents are deleted (step 11). If the service crashes between those two
   * steps, re-running will throw `TenantAlreadyInGroupError` at step 5 — the residual duplicate
   * documents in the source index must be cleaned up as a separate recovery operation.
   */
  async assignTenant(
    tenantId: string,
    logicalName: string,
    groupName: string
  ): Promise<ProvisioningResult> {
    const startMs = Date.now();
    if (!this.deps.registry[logicalName]) throw new Error(`Unknown logical index "${logicalName}"`);

    const { currentAlias, targetAlias } = await this.resolveAssignment(
      tenantId,
      logicalName,
      groupName
    );
    const reindexedCount = await this.doTenantReindex(currentAlias, targetAlias, tenantId);

    await this.deps.routingRepository.upsertRoute({
      tenantId,
      logicalName,
      resolvedAlias: targetAlias,
      groupName,
    });
    this.deps.resolver.invalidate(tenantId, logicalName);

    await this.deps.esClient.deleteByQuery({
      index: currentAlias,
      body: { query: { term: { tenantId } } },
    });

    return {
      success: true,
      operation: 'assign-tenant',
      details: { tenantId, logicalName, groupName, targetAlias, reindexed: reindexedCount },
      durationMs: Date.now() - startMs,
    };
  }

  private async resolveAssignment(
    tenantId: string,
    logicalName: string,
    groupName: string
  ): Promise<{ currentAlias: string; targetAlias: string }> {
    const targetAlias = GroupAliasNameBuilder.toAlias(groupName, logicalName);
    const targetExists = await this.deps.esClient.indices.existsAlias({ name: targetAlias });
    if (!targetExists.body) throw new GroupNotFoundError(groupName, targetAlias);

    const currentAlias = await this.deps.resolver.resolve(logicalName, tenantId);
    if (currentAlias === targetAlias) throw new TenantAlreadyInGroupError(tenantId, groupName);

    return { currentAlias, targetAlias };
  }

  private async doTenantReindex(
    sourceAlias: string,
    targetAlias: string,
    tenantId: string
  ): Promise<number> {
    const startedAt = new Date().toISOString();

    const result: any = await this.deps.esClient.reindex({
      wait_for_completion: true,
      body: {
        source: { index: sourceAlias, query: { term: { tenantId } } },
        dest: { index: targetAlias },
      },
    });

    await this.deps.esClient.reindex({
      wait_for_completion: true,
      body: {
        source: {
          index: sourceAlias,
          query: {
            bool: {
              must: [{ term: { tenantId } }, { range: { updatedAt: { gte: startedAt } } }],
            },
          },
        },
        dest: { index: targetAlias },
      },
    });

    return result.body?.total ?? 0;
  }
}

export { TenantProvisioningService };
